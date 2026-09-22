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
