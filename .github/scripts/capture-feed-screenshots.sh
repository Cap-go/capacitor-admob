#!/usr/bin/env bash
set -euo pipefail

repo_root="${GITHUB_WORKSPACE:-$(cd "$(dirname "$0")/../.." && pwd)}"
screenshots_dir="$repo_root/screenshots"
mkdir -p "$screenshots_dir"

cd "$repo_root"
bun install --frozen-lockfile
bun run build

cd "$repo_root/example-app"
bun install --frozen-lockfile
VITE_CI_FEED=1 bun run build
bunx cap sync android

cd android
chmod +x gradlew
./gradlew assembleDebug

adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done'

adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n app.capgo.admob/.MainActivity

sleep 8

# Scroll the WebView toward the in-feed section (section 5).
for _ in 1 2 3 4 5; do
  adb shell input swipe 400 1200 400 350 280
  sleep 1
done

# Allow test ads to load over the network.
sleep 25

adb exec-out screencap -p > "$screenshots_dir/feed-native-raw.png"

for _ in 1 2 3; do
  adb shell input swipe 400 1200 400 350 280
  sleep 1
done

sleep 8
adb exec-out screencap -p > "$screenshots_dir/feed-banner-raw.png"

if command -v convert >/dev/null 2>&1; then
  convert "$screenshots_dir/feed-native-raw.png" -resize 300x "$screenshots_dir/feed-native-in-feed.png"
  convert "$screenshots_dir/feed-banner-raw.png" -resize 300x "$screenshots_dir/feed-banner-in-feed.png"
else
  cp "$screenshots_dir/feed-native-raw.png" "$screenshots_dir/feed-native-in-feed.png"
  cp "$screenshots_dir/feed-banner-raw.png" "$screenshots_dir/feed-banner-in-feed.png"
fi

ls -la "$screenshots_dir"
