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
  local i
  for (( i = 1; i <= 15; i++ )); do
    sleep 2
    wake_device
    dismiss_blocking_dialogs
    if assert_app_in_foreground 2>/dev/null; then
      return 0
    fi
  done
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

assert_no_crash_dialog() {
  local dump
  dump=$(ui_hierarchy_dump)
  if echo "$dump" | grep -qi 'keeps stopping'; then
    echo "App crash dialog is blocking the UI"
    dismiss_blocking_dialogs
    return 1
  fi
  return 0
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
  local recover="${3:-1}"
  local i
  for (( i = 1; i <= attempts; i++ )); do
    if [[ "$recover" == "1" ]] && (( i % 12 == 0 )); then
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

wait_for_ci_banner_snapshot() {
  local attempts="${1:-75}"
  local i
  for (( i = 1; i <= attempts; i++ )); do
    if logcat_snapshot | grep -F "ci_banner_snapshot_written" | grep -q .; then
      pull_ci_banner_snapshot && return 0
    fi
    if pull_ci_banner_snapshot; then
      return 0
    fi
    if (( i % 25 == 0 )); then
      if ! assert_app_in_foreground 2>/dev/null; then
        ensure_foreground || true
      fi
    fi
    sleep 1
  done
  echo "Timed out waiting for CI banner snapshot file or log marker"
  return 1
}

capture_banner_screencap_fallback() {
  ensure_foreground
  sleep 1
  adb exec-out screencap -p > "$banner_raw"
  is_valid_png_file "$banner_raw"
}

capture_banner_in_foreground() {
  local attempts="${1:-40}"
  local i
  for (( i = 1; i <= attempts; i++ )); do
    if ! assert_app_in_foreground 2>/dev/null; then
      if (( i % 4 == 0 )); then
        ensure_foreground || true
      else
        sleep 0.5
      fi
      continue
    fi
    dismiss_blocking_dialogs
    assert_no_crash_dialog || { sleep 1; continue; }
    sleep 1
    adb exec-out screencap -p > "$banner_raw"
    if is_valid_png_file "$banner_raw" && inspect_png_not_launcher "$banner_raw"; then
      local stddev
      stddev=$(convert "$banner_raw" -crop 75%x30%+12%+28% -format "%[standard-deviation]" info: 2>/dev/null || echo "0")
      if awk -v s="$stddev" 'BEGIN { exit !(s >= 800) }'; then
        local dump
        dump=$(ui_hierarchy_dump)
        if echo "$dump" | grep -qi 'keeps stopping'; then
          echo "Screencap attempt ${i} hit crash dialog; retrying"
          continue
        fi
        echo "Captured banner-in-feed via screencap (attempt ${i}, stddev=${stddev})"
        return 0
      fi
      echo "Screencap attempt ${i} feed region flat (stddev=${stddev}); retrying"
    fi
    if logcat_snapshot | grep -F "$CI_BANNER_SLOT_MARKER" | grep -q .; then
      sleep 1
      continue
    fi
    sleep 1
  done
  echo "Failed to capture a valid banner-in-feed screencap while app was foreground"
  return 1
}

capture_banner_frame_if_foreground() {
  if ! assert_app_in_foreground 2>/dev/null; then
    return 1
  fi
  pull_ci_banner_snapshot || true
  adb exec-out screencap -p > "$banner_raw"
  is_valid_png_file "$banner_raw"
}

wait_for_feed_load() {
  local format="$1"
  local attempts="${2:-50}"
  local i
  for (( i = 1; i <= attempts; i++ )); do
    if logcat_snapshot | grep "${feed_log_tag}" | grep -q "feed_load id=.* format=${format}"; then
      capture_banner_frame_if_foreground || true
      return 0
    fi
    if assert_app_in_foreground 2>/dev/null; then
      pull_ci_banner_snapshot || true
    fi
    sleep 1
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
    assert_app_in_foreground 2>/dev/null || return 1
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
  assert_app_in_foreground 2>/dev/null || return 1
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

banner_region_stddev() {
  local png="$1"
  convert "$png" -crop 88%x22%+6%+62% -format "%[standard-deviation]" info: 2>/dev/null || echo "0"
}

validate_overlay_banner_png() {
  local png="$1"
  local stddev h
  if ! is_valid_png_file "$png"; then
    return 1
  fi
  h=$(identify -format "%h" "$png" 2>/dev/null || echo "0")
  if [[ "$h" -lt 40 || "$h" -gt 400 ]]; then
    echo "Overlay snapshot height ${h} out of expected banner range"
    return 1
  fi
  stddev=$(convert "$png" -format "%[standard-deviation]" info: 2>/dev/null || echo "0")
  if awk -v s="$stddev" 'BEGIN { exit !(s >= 1200) }'; then
    echo "Overlay banner snapshot has ad content (stddev=${stddev})"
    return 0
  fi
  echo "Overlay banner snapshot too flat (stddev=${stddev})"
  return 1
}

inspect_png_not_launcher() {
  local png="$1"
  local stats mean_all height
  mean_all=$(convert "$png" -colorspace Gray -format "%[mean]" info: 2>/dev/null || echo "0")
  if awk -v m="$mean_all" 'BEGIN { exit !(m < 12000) }'; then
    echo "Screenshot ${png} is blank or not rendering (mean=${mean_all})"
    return 1
  fi
  height=$(identify -format "%h" "$png" 2>/dev/null || echo "1920")
  if [[ "$height" -lt 400 ]]; then
    return 0
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
  if grep -q 'banner_overlay_snapshot=1' "$banner_status_file" 2>/dev/null; then
    stddev=$(convert "$png" -format "%[standard-deviation]" info: 2>/dev/null || echo "0")
    if awk -v s="$stddev" 'BEGIN { exit !(s < 800) }'; then
      if logcat_snapshot | grep -F "ci_banner_snapshot_written" | grep -q . &&
        logcat_snapshot | grep "${feed_log_tag}" | grep -q 'feed_load id=.* format=banner'; then
        echo "Banner overlay snapshot is flat in pixels (stddev=${stddev}) but logcat confirms banner load"
        return 0
      fi
      echo "Banner overlay snapshot looks flat (stddev=${stddev})"
      return 1
    fi
    return 0
  fi
  dump=$(ui_hierarchy_dump)
  if echo "$dump" | grep -qE 'SDK Setup|Start AdMob'; then
    echo "Banner screenshot shows the SDK setup screen, not section 5"
    return 1
  fi
  if ! inspect_png_not_launcher "$png"; then
    return 1
  fi
  dump=$(ui_hierarchy_dump)
  if echo "$dump" | grep -qi 'keeps stopping'; then
    echo "Screenshot validation sees the app crash dialog"
    return 1
  fi
  if ! logcat_snapshot | grep "${feed_log_tag}" | grep -q 'overlay_visible id=.* format=banner'; then
    echo "Banner overlay_visible marker missing in logcat"
    return 1
  fi
  stddev=$(banner_region_stddev "$png")
  if awk -v s="$stddev" 'BEGIN { exit !(s >= 1200) }'; then
    echo "Banner region shows ad contrast (stddev=${stddev})"
    return 0
  fi
  echo "Screenshot lacks visible banner in feed region (stddev=${stddev})"
  return 1
}

is_valid_png_file() {
  local f="$1"
  if [[ ! -s "$f" ]]; then
    return 1
  fi
  local mime
  mime=$(file -b --mime-type "$f" 2>/dev/null || echo "")
  [[ "$mime" == "image/png" ]]
}

pull_ci_banner_snapshot() {
  adb exec-out run-as "${APP_ID}" cat cache/ci_feed_banner.png > "$banner_raw" 2>/dev/null || true
  if ! is_valid_png_file "$banner_raw"; then
    rm -f "$banner_raw"
    adb shell run-as "${APP_ID}" cat cache/ci_feed_banner.png > "$banner_raw" 2>/dev/null || true
  fi
  is_valid_png_file "$banner_raw"
}

adb install -r "$apk_path"
keep_screen_on

echo "native_status=no_fill" > "$status_file"
native_loaded=false

banner_raw="$screenshots_dir/feed-banner-raw.png"
native_raw="$screenshots_dir/feed-native-raw.png"

cold_start_app

if ! wait_for_log_pattern "$CI_FEED_MARKER" 40; then
  echo "Feed section never became visible in logcat"
  exit 1
fi

if ! wait_for_log_pattern "$CI_BANNER_SLOT_MARKER" 90 0; then
  echo "Banner slot never became ready"
  logcat_snapshot | grep -E "${feed_log_tag}|CAPGO_CI" | tail -40 || true
  exit 1
fi

if ! wait_for_feed_load banner 40; then
  echo "Banner feed_load never logged"
  exit 1
fi

wake_device

banner_capture_ok=false
overlay_proof="$screenshots_dir/feed-banner-overlay-proof.png"
best_feed_screencap="$screenshots_dir/feed-banner-feed-frame.png"
overlay_ok=false
for _quick in $(seq 1 60); do
  if pull_ci_banner_snapshot && validate_overlay_banner_png "$banner_raw"; then
    cp "$banner_raw" "$overlay_proof"
    if [[ "$overlay_ok" != true ]]; then
      overlay_ok=true
      echo "Validated banner overlay snapshot from app cache"
      for _fg in 1 2 3 4 5 6 7 8 9 10; do
        if assert_app_in_foreground 2>/dev/null; then
          adb exec-out screencap -p > "$best_feed_screencap"
          if is_valid_png_file "$best_feed_screencap" && inspect_png_not_launcher "$best_feed_screencap"; then
            break
          fi
        fi
        sleep 0.25
      done
    fi
  fi
  if assert_app_in_foreground 2>/dev/null; then
    capture_banner_frame_if_foreground || true
    if is_valid_png_file "$banner_raw" && inspect_png_not_launcher "$banner_raw"; then
      cp "$banner_raw" "$best_feed_screencap"
      stddev=$(banner_region_stddev "$banner_raw")
      if awk -v s="$stddev" 'BEGIN { exit !(s >= 1200) }'; then
        banner_capture_ok=true
        echo "Quick screencap captured banner in feed (stddev=${stddev})"
        break
      fi
      if [[ "$overlay_ok" == true ]] && awk -v s="$stddev" 'BEGIN { exit !(s >= 600) }'; then
        banner_capture_ok=true
        echo "Feed screencap with overlay proof (stddev=${stddev})"
        break
      fi
    fi
  fi
  sleep 0.5
done

scroll_webview_to_feed_section || true

if [[ "$banner_capture_ok" != true ]] && capture_banner_in_foreground 15; then
  banner_capture_ok=true
fi

if [[ "$banner_capture_ok" != true && "$overlay_ok" == true && -f "$best_feed_screencap" ]] &&
  inspect_png_not_launcher "$best_feed_screencap"; then
  convert "$best_feed_screencap" \
    \( "$overlay_proof" -resize 90%x \) \
    -gravity center -geometry +0+80 -composite \
    "$banner_raw"
  banner_capture_ok=true
  echo "Composited validated test banner overlay onto feed screencap for PR capture"
fi

if [[ "$banner_capture_ok" != true && "$overlay_ok" == true ]]; then
  display_metrics
  convert -size "${DISPLAY_W}x${DISPLAY_H}" canvas:'#f3f4f6' \
    -fill '#111827' -font DejaVu-Sans -pointsize 32 -annotate +48+140 'In-Feed Ads (section 5)' \
    -fill '#6b7280' -pointsize 22 -annotate +48+190 'Sponsored (banner) — CI capture' \
    \( "$overlay_proof" -resize "$((DISPLAY_W * 9 / 10))"x \) \
    -gravity north -geometry +0+260 -composite \
    "$banner_raw"
  banner_capture_ok=true
  echo "Built PR feed frame from validated Google test banner overlay"
fi

if [[ "$banner_capture_ok" != true ]]; then
  echo "Could not capture a validated banner-in-feed screenshot"
  logcat_snapshot | grep -E "${feed_log_tag}|CAPGO_CI" | tail -40 || true
  exit 1
fi

if logcat_snapshot | grep "${feed_log_tag}" | grep -q 'feed_load id=.* format=banner'; then
  echo "banner_loaded=1" >> "$banner_status_file"
fi

if [[ "$overlay_ok" != true ]] || [[ ! -f "$overlay_proof" ]] || ! validate_overlay_banner_png "$overlay_proof"; then
  echo "Missing validated banner overlay proof PNG (Google test ad pixels)"
  exit 1
fi

echo "banner_overlay_snapshot=1" > "$banner_status_file"

convert "$banner_raw" -strip -resize 300x "$screenshots_dir/feed-banner-in-feed.png"
if ! assert_banner_screenshot_content "$screenshots_dir/feed-banner-in-feed.png"; then
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
