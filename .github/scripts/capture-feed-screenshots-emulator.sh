#!/usr/bin/env bash
set -euo pipefail

repo_root="${GITHUB_WORKSPACE:-$(cd "$(dirname "$0")/../.." && pwd)}"
screenshots_dir="$repo_root/screenshots"
apk_path="${FEED_APK_PATH:-$repo_root/example-app/android/app/build/outputs/apk/debug/app-debug.apk}"
feed_log_tag="CapgoAdmobFeed"

mkdir -p "$screenshots_dir"

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
adb shell input keyevent 82 || true

adb install -r "$apk_path"
adb logcat -c
adb shell am start -n app.capgo.admob/.MainActivity

sleep 14

for _ in 1 2 3 4 5 6; do
  adb shell input swipe 400 1200 400 350 220
  sleep 0.35
done

wait_for_feed_load() {
  local format="$1"
  local attempts=45
  local i
  for (( i = 1; i <= attempts; i++ )); do
    if adb logcat -d 2>/dev/null | grep "${feed_log_tag}" | grep -q "feed_load id=.* format=${format}"; then
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for feed_load (format=${format}) in logcat"
  adb logcat -d 2>/dev/null | grep "${feed_log_tag}" | tail -30 || true
  return 1
}

wait_for_feed_load native
sleep 1
adb exec-out screencap -p > "$screenshots_dir/feed-native-raw.png"

for _ in 1 2 3; do
  adb shell input swipe 400 1200 400 350 220
  sleep 0.35
done

wait_for_feed_load banner
sleep 1
adb exec-out screencap -p > "$screenshots_dir/feed-banner-raw.png"

convert "$screenshots_dir/feed-native-raw.png" -strip -resize 300x "$screenshots_dir/feed-native-in-feed.png"
convert "$screenshots_dir/feed-banner-raw.png" -strip -resize 300x "$screenshots_dir/feed-banner-in-feed.png"

ls -la "$screenshots_dir"
