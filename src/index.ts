import type { MobileAdOptions, RewardedAdOptions, RewardedInterstitialAdOptions } from './definitions';
import { AdMob, ensureAdMobStarted } from './plugin-instance';

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

    await ensureAdMobStarted();

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

class RewardedAd extends MobileAd<RewardedAdOptions> {
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

class RewardedInterstitialAd extends MobileAd<RewardedInterstitialAdOptions> {
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
export * from './events';
export * from './feed-ad';
export { AdMob, BannerAd, InterstitialAd, RewardedAd, RewardedInterstitialAd };
