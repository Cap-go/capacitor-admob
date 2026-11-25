# Example app Maestro flows

Build the example app with CI feed env vars before running Maestro.

Legacy bounds (default):

```bash
cd example-app
VITE_CI_FEED=1 bun run build
bunx cap copy android
maestro test .maestro/feed-legacy-bounds.yaml
```

WebView Native UI Engine:

```bash
cd example-app
VITE_CI_FEED=1 VITE_FEED_ENGINE=1 bun run build
bunx cap copy android
maestro test .maestro/feed-engine-success.yaml
```

The `feed-engine-bind-failure.yaml` flow expects a build **without** `VITE_FEED_ENGINE=1` and asserts the engine CI marker is absent.