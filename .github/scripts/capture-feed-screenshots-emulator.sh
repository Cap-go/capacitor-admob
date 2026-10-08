#!/usr/bin/env bash
set -euo pipefail

repo_root="${GITHUB_WORKSPACE:-$(cd "$(dirname "$0")/../.." && pwd)}"
screenshots_dir="$repo_root/screenshots"
apk_path="${FEED_APK_PATH:-$repo_root/example-app/android/app/build/outputs/apk/debug/app-debug.apk}"
feed_log_tag="CapgoAdmobFeed"
APP_ID="app.capgo.admob"
MAIN_ACTIVITY="${APP_ID}/.MainActivity"
CI_FEED_MARKER="CAPGO_CI_FEED_SECTION_VISIBLE"

mkdir -p "$screenshots_dir"
status_file="$screenshots_dir/native-ad-status.txt"

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
  line=$(adb shell wm size 2>/dev/null | grep -Eo '[0-9]+x[0-9]+' | tail -1)
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
  adb logcat -c >/dev/null 2>&1 || true
  adb shell am start -W -S -n "${MAIN_ACTIVITY}"
  sleep 5
  dismiss_blocking_dialogs
  assert_app_in_foreground
}

ensure_foreground() {
  wake_device
  dismiss_blocking_dialogs
  adb shell am start -W -n "${MAIN_ACTIVITY}" >/dev/null 2>&1 || true
  sleep 2
  assert_app_in_foreground
}

ui_hierarchy_dump() {
  adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1 || true
  adb exec-out cat /sdcard/window_dump.xml 2>/dev/null || true
}

assert_example_app_on_screen() {
  local dump
  dump=$(ui_hierarchy_dump)
  if echo "$dump" | grep -qi 'keeps stopping'; then
    echo "App crash dialog is blocking the UI"
    return 1
  fi
  echo "$dump" | grep -q "package=\"${APP_ID}\""
}

wait_for_log_pattern() {
  local pattern="$1"
  local attempts="${2:-45}"
  local i
  for (( i = 1; i <= attempts; i++ )); do
    if (( i % 12 == 0 )); then
      ensure_foreground || true
    fi
    if adb logcat -d 2>/dev/null | grep -F "$pattern" | grep -q .; then
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
      ensure_foreground || true
    fi
    if adb logcat -d 2>/dev/null | grep "${feed_log_tag}" | grep -q "feed_load id=.* format=${format}"; then
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for feed_load format=${format}"
  adb logcat -d 2>/dev/null | grep "${feed_log_tag}" | tail -30 || true
  return 1
}

wait_for_overlay_visible() {
  local format="$1"
  local attempts="${2:-40}"
  local i
  for (( i = 1; i <= attempts; i++ )); do
    ensure_foreground || true
    if adb logcat -d 2>/dev/null | grep "${feed_log_tag}" | grep -q "overlay_visible id=.* format=${format}"; then
      return 0
    fi
    scroll_feed_list_down 1
    sleep 0.8
  done
  echo "Timed out waiting for overlay_visible format=${format}"
  adb logcat -d 2>/dev/null | grep "${feed_log_tag}" | tail -30 || true
  return 1
}

scroll_feed_list_down() {
  local count="${1:-4}"
  local _i
  display_metrics
  local mid_x=$((DISPLAY_W / 2))
  local y1=$((DISPLAY_H * 68 / 100))
  local y2=$((DISPLAY_H * 38 / 100))
  for ((_i = 0; _i < count; _i++)); do
    ensure_foreground || true
    adb shell input swipe "$mid_x" "$y1" "$mid_x" "$y2" 280
    sleep 0.4
  done
}

capture_screenshot() {
  local outfile="$1"
  ensure_foreground
  assert_example_app_on_screen
  sleep 0.75
  adb exec-out screencap -p > "$outfile"
  if [[ ! -s "$outfile" ]]; then
    echo "Empty screenshot at ${outfile}"
    return 1
  fi
  assert_app_in_foreground
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

adb install -r "$apk_path"
keep_screen_on
cold_start_app

if ! wait_for_log_pattern "$CI_FEED_MARKER" 60; then
  echo "Feed section never became visible in logcat"
  exit 1
fi

echo "native_status=no_fill" > "$status_file"
native_loaded=false

if ! wait_for_feed_load banner 45; then
  echo "Banner test ad did not load; cannot produce in-feed screenshot"
  exit 1
fi

sleep 5
if adb logcat -d 2>/dev/null | grep "${feed_log_tag}" | grep -q 'feed_load id=.* format=native'; then
  native_loaded=true
  echo "native_status=loaded" > "$status_file"
fi

native_raw="$screenshots_dir/feed-native-raw.png"
banner_raw="$screenshots_dir/feed-banner-raw.png"

if [[ "$native_loaded" == true ]]; then
  ensure_foreground
  scroll_feed_list_down 3
  if adb logcat -d 2>/dev/null | grep "${feed_log_tag}" | grep -q 'overlay_visible id=.* format=native'; then
    capture_screenshot "$native_raw"
    convert "$native_raw" -strip -resize 300x "$screenshots_dir/feed-native-in-feed.png"
  else
    echo "Native overlay not visible; skipping native screenshot"
    echo "native_status=no_fill" > "$status_file"
    rm -f "$screenshots_dir/feed-native-in-feed.png" "$native_raw"
  fi
else
  echo "Skipping native screenshot (test unit no-fill on this emulator run)"
  rm -f "$screenshots_dir/feed-native-in-feed.png" "$native_raw"
fi

ensure_foreground
scroll_feed_list_down 16
sleep 3
if ! adb logcat -d 2>/dev/null | grep "${feed_log_tag}" | grep -q 'overlay_visible id=.* format=banner'; then
  echo "Banner overlay_visible marker missing after scroll"
  exit 1
fi
capture_screenshot "$banner_raw"
convert "$banner_raw" -strip -resize 300x "$screenshots_dir/feed-banner-in-feed.png"

if [[ ! -f "$screenshots_dir/feed-banner-in-feed.png" ]]; then
  echo "Missing required banner screenshot"
  exit 1
fi

if [[ -f "$screenshots_dir/feed-native-in-feed.png" ]]; then
  validate_png_pair "$screenshots_dir/feed-native-in-feed.png" "$screenshots_dir/feed-banner-in-feed.png"
fi

assert_app_in_foreground
ls -la "$screenshots_dir"
cat "$status_file"
