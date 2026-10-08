#!/usr/bin/env bash
set -euo pipefail

repo_root="${GITHUB_WORKSPACE:-$(cd "$(dirname "$0")/../.." && pwd)}"
screenshots_dir="$repo_root/screenshots"
apk_path="$repo_root/example-app/android/app/build/outputs/apk/debug/app-debug.apk"

mkdir -p "$screenshots_dir"

if [[ ! -f "$apk_path" ]]; then
  echo "Missing APK at $apk_path"
  exit 1
fi

boot_timeout=180
boot_start=$(date +%s)
adb wait-for-device
until adb shell getprop sys.boot_completed 2>/dev/null | grep -q 1; do
  if (( $(date +%s) - boot_start > boot_timeout )); then
    echo "Emulator boot timed out after ${boot_timeout}s"
    exit 1
  fi
  sleep 2
done

adb install -r "$apk_path"
adb shell am start -n app.capgo.admob/.MainActivity

sleep 4

for _ in 1 2 3 4; do
  adb shell input swipe 400 1200 400 350 200
  sleep 0.5
done

sleep 12

adb exec-out screencap -p > "$screenshots_dir/feed-native-raw.png"

for _ in 1 2; do
  adb shell input swipe 400 1200 400 350 200
  sleep 0.5
done

sleep 4
adb exec-out screencap -p > "$screenshots_dir/feed-banner-raw.png"

convert "$screenshots_dir/feed-native-raw.png" -resize 300x "$screenshots_dir/feed-native-in-feed.png"
convert "$screenshots_dir/feed-banner-raw.png" -resize 300x "$screenshots_dir/feed-banner-in-feed.png"

ls -la "$screenshots_dir"
