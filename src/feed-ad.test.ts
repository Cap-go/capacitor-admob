import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAdMob } = vi.hoisted(() => ({
  mockAdMob: {
    feedAdCreate: vi.fn(async () => ({ id: 1 })),
    feedAdLoad: vi.fn(async () => undefined),
    feedAdBindProjection: vi.fn(async () => undefined),
    feedAdUpdateBounds: vi.fn(async () => undefined),
    feedAdDestroy: vi.fn(async () => undefined),
    feedAdIsLoaded: vi.fn(async () => false),
    feedAdSetAutoRefresh: vi.fn(async () => undefined),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
  },
}));

vi.mock('./plugin-instance', () => ({
  AdMob: mockAdMob,
  ensureAdMobStarted: vi.fn(async () => undefined),
}));

// eslint-disable-next-line import-x/first -- mocked plugin-instance must load before feed-ad
import { FeedAd } from './feed-ad';
// eslint-disable-next-line import-x/first -- mocked plugin-instance must load before feed-ad
import { ensureFeedProjectionSelector } from './feed-projection';

describe('FeedAd bounds vs engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ensureFeedProjectionSelector assigns a stable id selector', () => {
    const el = document.createElement('div');
    const selector = ensureFeedProjectionSelector(el);
    expect(selector).toBe(`#${el.id}`);
    expect(el.id.startsWith('capgo-feed-ad-')).toBe(true);
  });

  it('legacy attachTo syncs bounds and never binds projection', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 20,
      width: 300,
      height: 250,
      bottom: 270,
      right: 310,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    } as DOMRect);

    const feedAd = new FeedAd({
      format: 'banner',
      adUnitId: 'test-unit',
    });
    await feedAd.attachTo(el);
    expect(mockAdMob.feedAdBindProjection).not.toHaveBeenCalled();
    expect(mockAdMob.feedAdUpdateBounds).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('engine attachTo binds projection and skips bounds sync', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const feedAd = new FeedAd({
      format: 'banner',
      adUnitId: 'test-unit',
      useWebViewNativeUiEngine: true,
    });
    await feedAd.attachTo(el);
    expect(mockAdMob.feedAdBindProjection).toHaveBeenCalledOnce();
    expect(mockAdMob.feedAdUpdateBounds).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });
});
