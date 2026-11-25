# Example app Maestro flows

From the repository root, install and build the plugin, then build the example app with CI feed env vars before running Maestro on a device or emulator.

Legacy bounds (default):

```bash
bun install
bun run build
cd example-app
bun install
VITE_CI_FEED=1 bun run build
bunx cap sync android
maestro test .maestro/feed-legacy-bounds.yaml
maestro test .maestro/feed-legacy-no-start.yaml
maestro test .maestro/feed-engine-legacy-marker.yaml
```

`feed-legacy-no-start.yaml` waits for CI auto-attach (`Attached feed-slot`), then taps destroy and checks the feed log.

WebView Native UI Engine:

```bash
bun install
bun run build
cd example-app
bun install
VITE_CI_FEED=1 VITE_FEED_ENGINE=1 bun run build
bunx cap sync android
maestro test .maestro/feed-engine-success.yaml
maestro test .maestro/feed-engine-no-loadfail.yaml
```

The `feed-engine-legacy-marker.yaml` flow runs against a build **without** `VITE_FEED_ENGINE=1`. It asserts the feed log never contains `"useWebViewNativeUiEngine": true`.

The `feed-engine-no-loadfail.yaml` flow runs on an engine build (`VITE_FEED_ENGINE=1` in the block above). It asserts `CAPGO_CI_FEED_ENGINE_ENABLED` in the feed log and that `feed.loadfail` never appears (load errors are logged under `feed.loadfail`).