import type { CapacitorConfig } from '@capacitor/cli';

import pkg from './package.json';

const config: CapacitorConfig = {
  appId: 'app.capgo.admob',
  appName: '@capgo/capacitor-admob',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
    CapacitorUpdater: {
      appId: 'app.capgo.admob',
      autoUpdate: true,
      autoSplashscreen: true,
      directUpdate: 'always',
      version: pkg.version,
    },
  },
};

export default config;
