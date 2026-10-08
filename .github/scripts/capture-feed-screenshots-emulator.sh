#!/usr/bin/env bash
set -euo pipefail

repo_root="${GITHUB_WORKSPACE:-$(cd "$(dirname "$0")/../.." && pwd)}"
screenshots_dir="$repo_root/screenshots"
apk_path="${FEED_APK_PATH:-$repo_root/example-app/android/app/build/outputs/apk/debug/app-debug.apk}"

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
adb shell am start -n app.capgo.admob/.MainActivity

# CI build auto-scrolls to feed and attaches ads after ~2.5s; allow network + ad fill.
sleep 8

for _ in 1 2 3 4 5; do
  adb shell input swipe 400 1200 400 350 220
  sleep 0.35
done

wait_for_ad_ui() {
  local attempts=20
  local i dump
  for (( i = 1; i <= attempts; i++ )); do
    adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1 || true
    dump=$(adb exec-out cat /sdcard/window_dump.xml 2>/dev/null || true)
    if echo "$dump" | grep -qiE 'Sponsored|Install|AdMob|Google'; then
      return 0
    fi
    sleep 2
  done
  echo "Warning: sponsored UI not detected in hierarchy; capturing anyway"
  return 0
}

wait_for_ad_ui
adb exec-out screencap -p > "$screenshots_dir/feed-native-raw.png"

for _ in 1 2 3; do
  adb shell input swipe 400 1200 400 350 220
  sleep 0.35
done

sleep 3
wait_for_ad_ui
adb exec-out screencap -p > "$screenshots_dir/feed-banner-raw.png"

convert "$screenshots_dir/feed-native-raw.png" -strip -resize 300x "$screenshots_dir/feed-native-in-feed.png"
convert "$screenshots_dir/feed-banner-raw.png" -strip -resize 300x "$screenshots_dir/feed-banner-in-feed.png"

ls -la "$screenshots_dir"
