/**
 * Typed event name constants for {@link AdMobPlusPlugin.addListener}.
 *
 * @since 8.2.0
 */
export const AdMobPlusEvents = {
  AdClick: 'ad.click',
  AdDismiss: 'ad.dismiss',
  AdImpression: 'ad.impression',
  AdLoad: 'ad.load',
  AdLoadFail: 'ad.loadfail',
  AdReward: 'ad.reward',
  AdShow: 'ad.show',
  AdShowFail: 'ad.showfail',
  BannerClick: 'banner.click',
  BannerClose: 'banner.close',
  BannerImpression: 'banner.impression',
  BannerLoad: 'banner.load',
  BannerLoadFail: 'banner.loadfail',
  BannerOpen: 'banner.open',
  BannerSizeChange: 'banner.sizechange',
  InterstitialDismiss: 'interstitial.dismiss',
  InterstitialImpression: 'interstitial.impression',
  InterstitialLoad: 'interstitial.load',
  InterstitialLoadFail: 'interstitial.loadfail',
  InterstitialShow: 'interstitial.show',
  InterstitialShowFail: 'interstitial.showfail',
  RewardedDismiss: 'rewarded.dismiss',
  RewardedImpression: 'rewarded.impression',
  RewardedInterstitialDismiss: 'rewardedi.dismiss',
  RewardedInterstitialImpression: 'rewardedi.impression',
  RewardedInterstitialLoad: 'rewardedi.load',
  RewardedInterstitialLoadFail: 'rewardedi.loadfail',
  RewardedInterstitialReward: 'rewardedi.reward',
  RewardedInterstitialShow: 'rewardedi.show',
  RewardedInterstitialShowFail: 'rewardedi.showfail',
  RewardedLoad: 'rewarded.load',
  RewardedLoadFail: 'rewarded.loadfail',
  RewardedReward: 'rewarded.reward',
  RewardedShow: 'rewarded.show',
  RewardedShowFail: 'rewarded.showfail',
} as const;

export type AdMobPlusEventName = (typeof AdMobPlusEvents)[keyof typeof AdMobPlusEvents];

/** Event payload always includes the native ad instance id (`adId`). iOS also emits legacy `id`. */
export type AdMobPlusAdIdPayload = {
  adId: number;
  id?: number;
};

/** Load and fullscreen show failure payloads from native `LoadAdError` / `FullScreenContentError`. */
export type AdMobPlusAdFailurePayload = AdMobPlusAdIdPayload & {
  code: number;
  message: string;
  /** Legacy iOS failure field; same string as `message` when present. */
  error?: string;
};

/** Reward callbacks include the earned reward plus `adId`. */
export type AdMobPlusAdRewardPayload = AdMobPlusAdIdPayload & {
  reward: {
    amount: number;
    type: string;
  };
};

/**
 * Maps each {@link AdMobPlusEventName} to the payload shape emitted from native code.
 *
 * @since 8.2.0
 */
export type AdMobPlusEventPayloadMap = {
  [AdMobPlusEvents.AdClick]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.AdDismiss]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.AdImpression]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.AdLoad]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.AdLoadFail]: AdMobPlusAdFailurePayload;
  [AdMobPlusEvents.AdReward]: AdMobPlusAdRewardPayload;
  [AdMobPlusEvents.AdShow]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.AdShowFail]: AdMobPlusAdFailurePayload;
  [AdMobPlusEvents.BannerClick]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.BannerClose]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.BannerImpression]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.BannerLoad]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.BannerLoadFail]: AdMobPlusAdFailurePayload;
  [AdMobPlusEvents.BannerOpen]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.BannerSizeChange]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.InterstitialDismiss]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.InterstitialImpression]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.InterstitialLoad]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.InterstitialLoadFail]: AdMobPlusAdFailurePayload;
  [AdMobPlusEvents.InterstitialShow]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.InterstitialShowFail]: AdMobPlusAdFailurePayload;
  [AdMobPlusEvents.RewardedDismiss]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.RewardedImpression]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.RewardedInterstitialDismiss]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.RewardedInterstitialImpression]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.RewardedInterstitialLoad]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.RewardedInterstitialLoadFail]: AdMobPlusAdFailurePayload;
  [AdMobPlusEvents.RewardedInterstitialReward]: AdMobPlusAdRewardPayload;
  [AdMobPlusEvents.RewardedInterstitialShow]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.RewardedInterstitialShowFail]: AdMobPlusAdFailurePayload;
  [AdMobPlusEvents.RewardedLoad]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.RewardedLoadFail]: AdMobPlusAdFailurePayload;
  [AdMobPlusEvents.RewardedReward]: AdMobPlusAdRewardPayload;
  [AdMobPlusEvents.RewardedShow]: AdMobPlusAdIdPayload;
  [AdMobPlusEvents.RewardedShowFail]: AdMobPlusAdFailurePayload;
};
