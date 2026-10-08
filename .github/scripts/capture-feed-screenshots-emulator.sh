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

adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done'

adb install -r "$apk_path"
adb shell am start -n app.capgo.admob/.MainActivity

sleep 6

for _ in 1 2 3 4 5; do
  adb shell input swipe 400 1200 400 350 280
  sleep 1
done

sleep 18

adb exec-out screencap -p > "$screenshots_dir/feed-native-raw.png"

for _ in 1 2 3; do
  adb shell input swipe 400 1200 400 350 280
  sleep 1
done

sleep 6
adb exec-out screencap -p > "$screenshots_dir/feed-banner-raw.png"

convert "$screenshots_dir/feed-native-raw.png" -resize 300x "$screenshots_dir/feed-native-in-feed.png"
convert "$screenshots_dir/feed-banner-raw.png" -resize 300x "$screenshots_dir/feed-banner-in-feed.png"

ls -la "$screenshots_dir"
