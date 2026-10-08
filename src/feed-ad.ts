import { Capacitor } from '@capacitor/core';

import type { FeedAdBounds, FeedAdCreateOptions } from './definitions';
import { AdMob, ensureAdMobStarted } from './plugin-instance';

const MIN_AUTO_REFRESH_MS = 30_000;

type BoundsListener = () => void;

/**
 * High-level helper for in-feed native or banner ads.
 *
 * Policy: impressions and clicks are recorded only on the native overlay
 * ({@link https://developers.google.com/admob/android/native/advanced | NativeAdView} /
 * GADNativeAdView). Use a placeholder element in your HTML feed and call
 * {@link FeedAd.attachTo} so the plugin keeps the overlay aligned on scroll and resize.
 */
export class FeedAd {
  private id: number | null = null;
  private readonly opts: FeedAdCreateOptions;
  private stopSync: (() => void) | null = null;

  constructor(opts: FeedAdCreateOptions) {
    if (opts.autoRefreshMs !== undefined && opts.autoRefreshMs !== null && opts.autoRefreshMs < MIN_AUTO_REFRESH_MS) {
      throw new Error(`autoRefreshMs must be at least ${MIN_AUTO_REFRESH_MS}`);
    }
    this.opts = opts;
  }

  get feedAdId(): number | null {
    return this.id;
  }

  async create(): Promise<number> {
    if (this.id !== null) {
      return this.id;
    }
    await ensureAdMobStarted();
    const result = await AdMob.feedAdCreate(this.opts);
    this.id = result.id;
    return this.id;
  }

  async load(): Promise<void> {
    const id = await this.create();
    await AdMob.feedAdLoad({ id });
  }

  async isLoaded(): Promise<boolean> {
    if (this.id === null) {
      return false;
    }
    return AdMob.feedAdIsLoaded({ id: this.id });
  }

  /**
   * Load the ad (if needed) and keep a native ad view aligned with `element`.
   */
  async attachTo(element: HTMLElement): Promise<void> {
    await this.load();
    this.startBoundsSync(element);
    await this.pushBounds(element);
  }

  async updatePosition(bounds: FeedAdBounds): Promise<void> {
    const id = await this.create();
    await AdMob.feedAdUpdateBounds({ id, ...bounds });
  }

  async setAutoRefresh(autoRefreshMs: number | null): Promise<void> {
    if (autoRefreshMs !== null && autoRefreshMs < MIN_AUTO_REFRESH_MS) {
      throw new Error(`autoRefreshMs must be at least ${MIN_AUTO_REFRESH_MS}`);
    }
    const id = await this.create();
    await AdMob.feedAdSetAutoRefresh({ id, autoRefreshMs });
  }

  async destroy(): Promise<void> {
    this.stopBoundsSync();
    if (this.id !== null) {
      await AdMob.feedAdDestroy({ id: this.id });
      this.id = null;
    }
  }

  private startBoundsSync(element: HTMLElement): void {
    this.stopBoundsSync();

    const onChange: BoundsListener = () => {
      void this.pushBounds(element);
    };

    const scrollTargets: EventTarget[] = [window];
    let parent: HTMLElement | null = element.parentElement;
    while (parent) {
      scrollTargets.push(parent);
      parent = parent.parentElement;
    }

    scrollTargets.forEach((target) => {
      target.addEventListener('scroll', onChange, { passive: true });
    });
    window.addEventListener('resize', onChange, { passive: true });
    window.addEventListener('orientationchange', onChange);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(onChange);
      resizeObserver.observe(element);
    }

    let rafId = 0;
    const tick = () => {
      void this.pushBounds(element);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    this.stopSync = () => {
      scrollTargets.forEach((target) => {
        target.removeEventListener('scroll', onChange);
      });
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(rafId);
    };
  }

  private stopBoundsSync(): void {
    this.stopSync?.();
    this.stopSync = null;
  }

  private async pushBounds(element: HTMLElement): Promise<void> {
    if (this.id === null) {
      return;
    }
    const rect = element.getBoundingClientRect();
    const visible =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.top < (window.innerHeight || document.documentElement.clientHeight);

    const density = Capacitor.isNativePlatform() ? window.devicePixelRatio || 1 : 1;

    await AdMob.feedAdUpdateBounds({
      id: this.id,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      visible,
      density,
    });
  }
}

export { MIN_AUTO_REFRESH_MS as FEED_AD_MIN_AUTO_REFRESH_MS };
