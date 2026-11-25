# Example app Maestro flows

From the repository root, install and build the plugin, then build the example app with CI feed env vars before running Maestro on a device or emulator.

Use `bunx cap run android` (or Xcode run for iOS) after `cap sync` so the installed app matches the build under test. `cap copy` alone does not update the device binary.

Legacy bounds (manual attach, no CI auto-start):

```bash
bun install
bun run build
cd example-app
bun install
VITE_CI_FEED=1 VITE_CI_FEED_MANUAL=1 bun run build
bunx cap sync android
bunx cap run android
maestro test .maestro/feed-legacy-bounds.yaml
maestro test .maestro/feed-legacy-no-start.yaml
```

```bash
VITE_CI_FEED=1 bun run build
bunx cap sync android
bunx cap run android
maestro test .maestro/feed-engine-legacy-marker.yaml
```

`feed-legacy-no-start.yaml` taps **Destroy Feed Ads** without prior attach (`VITE_CI_FEED_MANUAL=1` disables CI auto-attach).

WebView Native UI Engine:

```bash
bun install
bun run build
cd example-app
bun install
VITE_CI_FEED=1 VITE_FEED_ENGINE=1 bun run build
bunx cap sync android
bunx cap run android
maestro test .maestro/feed-engine-success.yaml
maestro test .maestro/feed-engine-no-loadfail.yaml
maestro test .maestro/feed-engine-scroll-placement.yaml
```

Bind rejection (legacy feed ad, engine bind API):

```bash
VITE_CI_FEED=1 VITE_MAESTRO_BIND_REJECT=1 bun run build
bunx cap sync android
bunx cap run android
maestro test .maestro/feed-engine-bind-reject.yaml
```

The `feed-engine-legacy-marker.yaml` flow runs against a build **without** `VITE_FEED_ENGINE=1`. It asserts the feed log never contains `"useWebViewNativeUiEngine": true`.

The `feed-engine-no-loadfail.yaml` flow runs on an engine build. It asserts `CAPGO_CI_FEED_ENGINE_ENABLED` in the feed log and that `feed.loadfail` never appears.

The `feed-engine-scroll-placement.yaml` flow waits for feed attach, a scripted list scroll, and the `CAPGO_FEED_SCROLL_CHECK` log marker.