import { registerPlugin } from '@capacitor/core';

import type { AdMobPlusPlugin } from './definitions';

export const AdMob = registerPlugin<AdMobPlusPlugin>('AdMobPlus', {
  web: () => import('./web').then((m) => new m.AdMobPlusWeb()),
});

let started = false;
let startPromise: ReturnType<typeof AdMob.start> | null = null;

const start = AdMob.start.bind(AdMob);
export const ensureAdMobStarted = async (): Promise<void> => {
  if (started) return;

  if (startPromise === null) {
    startPromise = start()
      .then((result) => {
        started = true;
        return result;
      })
      .catch((error) => {
        startPromise = null;
        throw error;
      });
  }

  return startPromise;
};
AdMob.start = ensureAdMobStarted as AdMobPlusPlugin['start'];

const adIsLoaded = AdMob.adIsLoaded.bind(AdMob);
AdMob.adIsLoaded = (async (...args: Parameters<AdMobPlusPlugin['adIsLoaded']>) => {
  const result = (await adIsLoaded(...args)) as boolean | { value?: boolean };
  return typeof result === 'boolean' ? result : result.value === true;
}) as AdMobPlusPlugin['adIsLoaded'];

const feedAdIsLoaded = AdMob.feedAdIsLoaded.bind(AdMob);
AdMob.feedAdIsLoaded = (async (...args: Parameters<AdMobPlusPlugin['feedAdIsLoaded']>) => {
  const result = (await feedAdIsLoaded(...args)) as boolean | { value?: boolean };
  return typeof result === 'boolean' ? result : result.value === true;
}) as AdMobPlusPlugin['feedAdIsLoaded'];
