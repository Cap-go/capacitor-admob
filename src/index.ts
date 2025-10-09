import { registerPlugin } from '@capacitor/core';

import type { AdMobPlusPlugin, MobileAdOptions } from './definitions';

const AdMob = registerPlugin<AdMobPlusPlugin>('AdMobPlus', {
  web: () => import('./web').then((m) => new m.AdMobPlusWeb()),
});

let started = false;
let startPromise: ReturnType<typeof AdMob.start> | null = null;

const start = AdMob.start;
AdMob.start = async () => {
  startPromise = start();
  const result = await startPromise;
  started = true;
  return result;
};

class MobileAd<T extends MobileAdOptions = MobileAdOptions> {
  private static allAds: { [s: number]: MobileAd } = {};
  private static idCounter = 0;

  public readonly id: number;

  protected readonly opts: T;

  #created = false;
  #init: Promise<any> | null = null;

  constructor(opts: T) {
    this.opts = opts;

    this.id = MobileAd.nextId();
    MobileAd.allAds[this.id] = this;
  }

  private static nextId() {
    MobileAd.idCounter += 1;
    return MobileAd.idCounter;
  }

  public get adUnitId() {
    return this.opts.adUnitId;
  }

  protected async isLoaded() {
    await this.init();
    return AdMob.adIsLoaded({ id: this.id });
  }

  protected async load() {
    await this.init();
    return AdMob.adLoad({ ...this.opts, id: this.id });
  }

  protected async show() {
    await this.init();
    return AdMob.adShow({ id: this.id });
  }

  protected async hide() {
    await this.init();
    return AdMob.adHide({ id: this.id });
  }

  protected async init() {
    if (this.#created) return;

    if (!started) {
      if (startPromise === null) start();
      await startPromise;
    }

    if (this.#init === null) {
      const cls = (this.constructor as unknown as { cls?: string }).cls ?? this.constructor.name;

      this.#init = AdMob.adCreate({
        ...this.opts,
        id: this.id,
        cls,
      });
    }

    await this.#init;
    this.#created = true;
  }
}

type Position = 'top' | 'bottom';

export interface BannerAdOptions extends MobileAdOptions {
  position?: Position;
}

class BannerAd extends MobileAd {
  static cls = 'BannerAd';
  #loaded = false;

  constructor(opts: BannerAdOptions) {
    super({
      position: 'bottom',
      ...opts,
    });
  }

  isLoaded(): Promise<boolean> {
    return super.isLoaded();
  }

  async load(): Promise<void> {
    await super.load();
    this.#loaded = true;
  }

  async show(): Promise<void> {
    if (!this.#loaded) await this.load();
    await super.show();
  }

  hide(): Promise<void> {
    return super.hide();
  }
}

class InterstitialAd extends MobileAd {
  static cls = 'InterstitialAd';

  isLoaded(): Promise<boolean> {
    return super.isLoaded();
  }

  async load(): Promise<void> {
    return super.load();
  }

  async show(): Promise<void> {
    return super.show();
  }
}

class RewardedAd extends MobileAd {
  static cls = 'RewardedAd';

  isLoaded(): Promise<boolean> {
    return super.isLoaded();
  }

  async load(): Promise<void> {
    return super.load();
  }

  async show(): Promise<void> {
    return super.show();
  }
}

class RewardedInterstitialAd extends MobileAd {
  static cls = 'RewardedInterstitialAd';

  isLoaded(): Promise<boolean> {
    return super.isLoaded();
  }

  async load(): Promise<void> {
    return super.load();
  }

  async show(): Promise<void> {
    return super.show();
  }
}

export * from './definitions';
export { AdMob, BannerAd, InterstitialAd, RewardedAd, RewardedInterstitialAd };
