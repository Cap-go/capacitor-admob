#!/usr/bin/env bash
set -euo pipefail

repo_root="${GITHUB_WORKSPACE:-$(cd "$(dirname "$0")/../.." && pwd)}"
screenshots_dir="$repo_root/screenshots"
apk_path="${FEED_APK_PATH:-$repo_root/example-app/android/app/build/outputs/apk/debug/app-debug.apk}"
feed_log_tag="CapgoAdmobFeed"
APP_ID="app.capgo.admob"
MAIN_ACTIVITY="${APP_ID}/.MainActivity"
CI_FEED_MARKER="CAPGO_CI_FEED_SECTION_VISIBLE"
CI_BANNER_SLOT_MARKER="CAPGO_CI_BANNER_SLOT_READY"
CI_NATIVE_SLOT_MARKER="CAPGO_CI_NATIVE_SLOT_READY"

mkdir -p "$screenshots_dir"
status_file="$screenshots_dir/native-ad-status.txt"
banner_status_file="$screenshots_dir/banner-ad-status.txt"

if [[ ! -f "$apk_path" ]]; then
  echo "Missing APK at $apk_path"
  exit 1
fi

boot_timeout=240
boot_start=$(date +%s)
adb wait-for-device
until adb shell getprop sys.boot_completed 2>/dev/null | grep -q 1; do
  if (( $(date +%s) - boot_start > boot_timeout )); then
    echo "Emulator boot timed out after ${boot_timeout}s"
    exit 1
  fi
  sleep 2
done

wake_device() {
  adb shell input keyevent KEYCODE_WAKEUP >/dev/null 2>&1 || true
  adb shell wm dismiss-keyguard >/dev/null 2>&1 || true
}

keep_screen_on() {
  adb shell settings put system screen_off_timeout 2147483647 >/dev/null 2>&1 || true
  adb shell svc power stayon usb >/dev/null 2>&1 || true
}

display_metrics() {
  local line w h
  line=$(adb shell wm size 2>/dev/null | { grep -Eo '[0-9]+x[0-9]+' || true; } | tail -1)
  w=${line%x*}
  h=${line#*x}
  if [[ -z "$w" || -z "$h" ]]; then
    w=1080
    h=1920
  fi
  DISPLAY_W=$w
  DISPLAY_H=$h
}

assert_app_in_foreground() {
  local dump
  dump=$(adb shell dumpsys activity activities 2>/dev/null || true)
  if echo "$dump" | grep -E 'mResumedActivity|topResumedActivity' | grep -q "${APP_ID}"; then
    return 0
  fi
  echo "Expected ${APP_ID} in resumed activity; got:"
  echo "$dump" | grep -E 'mResumedActivity|topResumedActivity' | head -5 || true
  return 1
}

dismiss_blocking_dialogs() {
  local dump
  dump=$(adb shell uiautomator dump /sdcard/window_dump.xml 2>/dev/null && adb exec-out cat /sdcard/window_dump.xml 2>/dev/null || true)
  if echo "$dump" | grep -qi 'keeps stopping'; then
    display_metrics
    adb shell input tap "$((DISPLAY_W / 2))" "$((DISPLAY_H * 82 / 100))"
    sleep 1
  fi
}

cold_start_app() {
  wake_device
  if [[ "${SKIP_LOGCAT_CLEAR:-}" != "1" ]]; then
    adb logcat -c >/dev/null 2>&1 || true
  fi
  adb shell am start -W -S -n "${MAIN_ACTIVITY}"
  sleep 5
  dismiss_blocking_dialogs
  assert_app_in_foreground
}

ensure_foreground() {
  wake_device
  dismiss_blocking_dialogs
  if assert_app_in_foreground 2>/dev/null; then
    return 0
  fi
  adb shell am start -W -n "${MAIN_ACTIVITY}" >/dev/null 2>&1 || true
  sleep 2
  if assert_app_in_foreground 2>/dev/null; then
    return 0
  fi
  assert_app_in_foreground
}

maybe_recover_foreground() {
  if ! assert_app_in_foreground 2>/dev/null; then
    ensure_foreground
  fi
}

ui_hierarchy_dump() {
  adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1 || true
  adb exec-out cat /sdcard/window_dump.xml 2>/dev/null || true
}

logcat_snapshot() {
  adb logcat -d 2>/dev/null || true
}

recent_logcat() {
  adb logcat -d -t 80 2>/dev/null || true
}

assert_example_app_on_screen() {
  local dump
  dump=$(ui_hierarchy_dump)
  if echo "$dump" | grep -qi 'keeps stopping'; then
    echo "App crash dialog is blocking the UI"
    return 1
  fi
  if ! echo "$dump" | grep -q "package=\"${APP_ID}\""; then
    echo "UI hierarchy is not from ${APP_ID}"
    return 1
  fi
  # WebView HTML is often not exposed in the accessibility tree; rely on resumed activity + markers.
  if echo "$dump" | grep -qE 'package="com\.google\.android\.apps\.nexuslauncher"'; then
    echo "Launcher is in the UI hierarchy instead of the example app"
    return 1
  fi
}

wait_for_log_pattern() {
  local pattern="$1"
  local attempts="${2:-45}"
  local i
  for (( i = 1; i <= attempts; i++ )); do
    if (( i % 12 == 0 )); then
      maybe_recover_foreground || true
    fi
    if logcat_snapshot | grep -F "$pattern" | grep -q .; then
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for log pattern: ${pattern}"
  return 1
}

wait_for_feed_load() {
  local format="$1"
  local attempts="${2:-50}"
  local i
  for (( i = 1; i <= attempts; i++ )); do
    if (( i % 12 == 0 )); then
      maybe_recover_foreground || true
    fi
    if logcat_snapshot | grep "${feed_log_tag}" | grep -q "feed_load id=.* format=${format}"; then
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for feed_load format=${format}"
  logcat_snapshot | grep "${feed_log_tag}" | tail -30 || true
  return 1
}

wait_for_banner_slot_ready() {
  local attempts="${1:-40}"
  local i
  for (( i = 1; i <= attempts; i++ )); do
    if (( i % 10 == 0 )); then
      maybe_recover_foreground || true
    fi
    if logcat_snapshot | grep -E "${CI_BANNER_SLOT_MARKER}|ci_banner_slot_ready|overlay_visible id=.* format=banner" | grep -q .; then
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for banner slot readiness markers"
  logcat_snapshot | grep -E "${feed_log_tag}|CAPGO_CI" | tail -40 || true
  return 1
}

wait_for_native_slot_ready() {
  local attempts="${1:-25}"
  local i
  for (( i = 1; i <= attempts; i++ )); do
    maybe_recover_foreground || true
    if logcat_snapshot | grep -E "${CI_NATIVE_SLOT_MARKER}|overlay_visible id=.* format=native" | grep -q .; then
      return 0
    fi
    sleep 2
  done
  return 1
}

scroll_webview_to_feed_section() {
  local dump attempt
  for attempt in $(seq 1 16); do
    assert_app_in_foreground
    dump=$(ui_hierarchy_dump)
    if echo "$dump" | grep -qE 'In-Feed|Sponsored \(banner'; then
      return 0
    fi
    if echo "$dump" | grep -q 'SDK Setup'; then
      adb shell input keyevent 93
      sleep 0.4
      continue
    fi
    return 0
  done
  echo "Could not scroll the WebView to the feed section"
  return 1
}

capture_screenshot() {
  local outfile="$1"
  local attempt
  for attempt in $(seq 1 6); do
    ensure_foreground
    if assert_example_app_on_screen 2>/dev/null; then
      break
    fi
    sleep 1
  done
  assert_example_app_on_screen
  assert_app_in_foreground
  sleep 1
  adb exec-out screencap -p > "$outfile"
  if [[ ! -s "$outfile" ]]; then
    echo "Empty screenshot at ${outfile}"
    return 1
  fi
}

validate_png_pair() {
  local a="$1"
  local b="$2"
  if [[ ! -f "$a" || ! -f "$b" ]]; then
    return 0
  fi
  local ha hb
  ha=$(md5sum "$a" | awk '{print $1}')
  hb=$(md5sum "$b" | awk '{print $1}')
  if [[ "$ha" == "$hb" ]]; then
    echo "Screenshots are byte-identical; refusing to upload invalid captures"
    return 1
  fi
  return 0
}

inspect_png_not_launcher() {
  local png="$1"
  local stats mean_all
  mean_all=$(convert "$png" -colorspace Gray -format "%[mean]" info: 2>/dev/null || echo "0")
  if awk -v m="$mean_all" 'BEGIN { exit !(m < 12000) }'; then
    echo "Screenshot ${png} is blank or not rendering (mean=${mean_all})"
    return 1
  fi
  stats=$(convert "$png" -crop 90%x12%+5%+8% -format "%[mean]" info: 2>/dev/null || echo "")
  if [[ -n "$stats" ]] && awk -v m="$stats" 'BEGIN { exit !(m > 45000) }'; then
    echo "Screenshot ${png} looks like the Android launcher (bright status/search band)"
    return 1
  fi
  return 0
}

assert_banner_screenshot_content() {
  local png="$1"
  local dump stddev
  if [[ ! -f "$banner_status_file" ]]; then
    echo "Banner load status file missing before capture"
    return 1
  fi
  dump=$(ui_hierarchy_dump)
  if echo "$dump" | grep -qE 'SDK Setup|Start AdMob'; then
    echo "Banner screenshot shows the SDK setup screen, not section 5"
    return 1
  fi
  if ! inspect_png_not_launcher "$png"; then
    return 1
  fi
  stddev=$(convert "$png" -crop 75%x30%+12%+28% -format "%[standard-deviation]" info: 2>/dev/null || echo "0")
  if awk -v s="$stddev" 'BEGIN { exit !(s < 2000) }'; then
    echo "Screenshot feed region looks flat (stddev=${stddev}); banner likely not visible"
    return 1
  fi
  return 0
}

run_banner_capture_sidecar() {
  stdbuf -oL adb logcat -v brief CapgoAdmobFeed:I Capacitor/Console:I *:S 2>/dev/null | while IFS= read -r line; do
    if [[ "$line" == *"feed_load id="* ]] && [[ "$line" == *"format=banner"* ]]; then
      echo "banner_loaded=1" > "$banner_status_file"
    fi
    if [[ "$line" != *"ci_banner_slot_ready"* ]] && [[ "$line" != *"CAPGO_CI_BANNER_SLOT_READY"* ]]; then
      continue
    fi
    sleep 0.4
    wake_device
    adb exec-out screencap -p > "$banner_raw" || true
    if [[ ! -s "$banner_raw" ]]; then
      continue
    fi
    convert "$banner_raw" -strip -resize 300x "$screenshots_dir/feed-banner-in-feed.png"
    if assert_banner_screenshot_content "$screenshots_dir/feed-banner-in-feed.png"; then
      exit 0
    fi
  done
  exit 1
}

adb install -r "$apk_path"
keep_screen_on

echo "native_status=no_fill" > "$status_file"
native_loaded=false

banner_raw="$screenshots_dir/feed-banner-raw.png"
native_raw="$screenshots_dir/feed-native-raw.png"

adb logcat -c >/dev/null 2>&1 || true
SKIP_LOGCAT_CLEAR=1 run_banner_capture_sidecar &
CAPTURE_PID=$!

SKIP_LOGCAT_CLEAR=1 cold_start_app

capture_deadline=$(( $(date +%s) + 90 ))
capture_exit=1
while kill -0 "$CAPTURE_PID" 2>/dev/null; do
  if (( $(date +%s) >= capture_deadline )); then
    kill "$CAPTURE_PID" 2>/dev/null || true
    echo "Timed out waiting for banner capture sidecar"
    break
  fi
  sleep 1
done
if wait "$CAPTURE_PID" 2>/dev/null; then
  capture_exit=0
fi

if [[ "$capture_exit" -ne 0 ]] || [[ ! -f "$screenshots_dir/feed-banner-in-feed.png" ]]; then
  logcat_snapshot | grep -E "${feed_log_tag}|CAPGO_CI" | tail -40 || true
  exit 1
fi

if ! logcat_snapshot | grep -F "$CI_FEED_MARKER" | grep -q .; then
  echo "Feed section marker never appeared in logcat"
  exit 1
fi

if logcat_snapshot | grep "${feed_log_tag}" | grep -q 'feed_load id=.* format=native'; then
  native_loaded=true
  echo "native_status=loaded" > "$status_file"
fi

if [[ "$native_loaded" == true ]] && wait_for_native_slot_ready 30; then
  ensure_foreground
  sleep 2
  capture_screenshot "$native_raw"
  convert "$native_raw" -strip -resize 300x "$screenshots_dir/feed-native-in-feed.png"
  inspect_png_not_launcher "$screenshots_dir/feed-native-in-feed.png"
else
  echo "Skipping native screenshot (test unit no-fill on this emulator run)"
  rm -f "$screenshots_dir/feed-native-in-feed.png" "$native_raw"
fi

if [[ ! -f "$screenshots_dir/feed-banner-in-feed.png" ]]; then
  echo "Missing required banner screenshot"
  exit 1
fi

if [[ -f "$screenshots_dir/feed-native-in-feed.png" ]]; then
  validate_png_pair "$screenshots_dir/feed-native-in-feed.png" "$screenshots_dir/feed-banner-in-feed.png"
fi

maybe_recover_foreground || true
ls -la "$screenshots_dir"
cat "$status_file"
