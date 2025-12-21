import { AdMob, BannerAd, InterstitialAd, RewardedAd } from '@capgo/capacitor-admob';

const ui = {
  start: document.getElementById('startButton'),
  configure: document.getElementById('configureButton'),
  requestConfig: document.getElementById('requestConfigButton'),
  appVolume: document.getElementById('appVolume'),
  contentRating: document.getElementById('contentRating'),
  testDeviceId: document.getElementById('testDeviceId'),
  appMuted: document.getElementById('appMuted'),
  sameAppKey: document.getElementById('sameAppKey'),
  childDirected: document.getElementById('childDirected'),
  underAge: document.getElementById('underAge'),
  bannerUnitId: document.getElementById('bannerUnitId'),
  bannerPosition: document.getElementById('bannerPosition'),
  bannerLoad: document.getElementById('bannerLoadButton'),
  bannerShow: document.getElementById('bannerShowButton'),
  bannerHide: document.getElementById('bannerHideButton'),
  bannerHideTop: document.getElementById('bannerHideTopButton'),
  bannerHideBottom: document.getElementById('bannerHideBottomButton'),
  interstitialUnitId: document.getElementById('interstitialUnitId'),
  interstitialLoad: document.getElementById('interstitialLoadButton'),
  interstitialShow: document.getElementById('interstitialShowButton'),
  rewardedUnitId: document.getElementById('rewardedUnitId'),
  rewardedLoad: document.getElementById('rewardedLoadButton'),
  rewardedShow: document.getElementById('rewardedShowButton'),
  trackingStatus: document.getElementById('trackingStatusButton'),
  requestTracking: document.getElementById('requestTrackingButton'),
  removeListeners: document.getElementById('removeListenersButton'),
  clearLog: document.getElementById('clearLogButton'),
  log: document.getElementById('logOutput'),
};

let bannerAdTop = null;
let bannerAdBottom = null;
let bannerConfig = { unitId: '', position: 'bottom' };
let interstitialAd = null;
let interstitialConfig = { unitId: '' };
let rewardedAd = null;
let rewardedConfig = { unitId: '' };
let eventListenerHandles = [];

const eventNames = [
  'ad.click',
  'ad.dismiss',
  'ad.impression',
  'ad.load',
  'ad.loadfail',
  'ad.reward',
  'ad.show',
  'ad.showfail',
  'banner.click',
  'banner.close',
  'banner.impression',
  'banner.load',
  'banner.loadfail',
  'banner.open',
  'banner.sizechange',
  'interstitial.dismiss',
  'interstitial.impression',
  'interstitial.load',
  'interstitial.loadfail',
  'interstitial.show',
  'interstitial.showfail',
  'rewarded.dismiss',
  'rewarded.impression',
  'rewarded.load',
  'rewarded.loadfail',
  'rewarded.reward',
  'rewarded.show',
  'rewarded.showfail',
  'rewardedi.dismiss',
  'rewardedi.impression',
  'rewardedi.load',
  'rewardedi.loadfail',
  'rewardedi.reward',
  'rewardedi.show',
  'rewardedi.showfail',
];

const formatDetails = (details) => {
  if (details === undefined) return '';
  if (details === null) return 'null';
  if (details instanceof Error) return `${details.message}\n${details.stack ?? ''}`;
  if (typeof details === 'object') {
    try {
      return JSON.stringify(details, null, 2);
    } catch (err) {
      return String(details);
    }
  }
  return String(details);
};

const log = (message, details) => {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[1].replace('Z', '');
  const detailText = details !== undefined ? `\n${formatDetails(details)}` : '';
  const entry = `[${timestamp}] ${message}${detailText}`;

  if (ui.log.textContent.startsWith('Logs will appear here.')) {
    ui.log.textContent = entry;
  } else {
    ui.log.textContent = `${entry}\n\n${ui.log.textContent}`;
  }

  if (details !== undefined) {
    console.log(message, details); // eslint-disable-line no-console
  } else {
    console.log(message); // eslint-disable-line no-console
  }
};

const parseNumber = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const registerEventListeners = () => {
  if (eventListenerHandles.length > 0) return;

  eventNames.forEach((eventName) => {
    const handlePromise = AdMob.addListener(eventName, (event) => {
      log(`Event: ${eventName}`, event);
    });
    eventListenerHandles.push(handlePromise);
  });
  log('AdMob listeners registered for SDK events.');
};

const removeEventListeners = async () => {
  if (eventListenerHandles.length === 0) {
    log('No listeners to remove.');
    return;
  }
  const handles = await Promise.all(eventListenerHandles);
  await Promise.allSettled(handles.map((handle) => handle.remove()));
  eventListenerHandles = [];
  log('All AdMob listeners removed. Reload to re-register.');
};

const startAdMob = async () => {
  try {
    await AdMob.start();
    log('AdMob SDK started.');
  } catch (error) {
    log('Failed to start AdMob.', error);
  }
};

const applyAppConfig = async () => {
  const volume = Math.min(1, Math.max(0, parseNumber(ui.appVolume.value, 0.5)));
  const muted = ui.appMuted.checked;

  try {
    await AdMob.configure({ appVolume: volume, appMuted: muted });
    log('App configuration applied.', { appVolume: volume, appMuted: muted });
  } catch (error) {
    log('Failed to apply app configuration.', error);
  }
};

const applyRequestConfig = async () => {
  const rating = ui.contentRating.value;
  const testIds = ui.testDeviceId.value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const sameAppKey = ui.sameAppKey.checked;
  const childDirected = ui.childDirected.checked;
  const underAge = ui.underAge.checked;

  const requestConfig = {};
  if (rating) requestConfig.maxAdContentRating = rating;
  if (sameAppKey) requestConfig.sameAppKey = true;
  if (childDirected) requestConfig.tagForChildDirectedTreatment = true;
  if (underAge) requestConfig.tagForUnderAgeOfConsent = true;
  if (testIds.length > 0) requestConfig.testDeviceIds = testIds;

  try {
    await AdMob.configRequest(requestConfig);
    log('Request configuration applied.', requestConfig);
  } catch (error) {
    log('Failed to apply request configuration.', error);
  }
};

const ensureBannerInstance = (unitId, position) => {
  if (position === 'top') {
    if (!bannerAdTop || bannerConfig.unitId !== unitId) {
      bannerAdTop = new BannerAd({ adUnitId: unitId, position: 'top' });
    }
    return bannerAdTop;
  } else {
    if (!bannerAdBottom || bannerConfig.unitId !== unitId) {
      bannerAdBottom = new BannerAd({ adUnitId: unitId, position: 'bottom' });
    }
    return bannerAdBottom;
  }
};

const loadBanner = async () => {
  const unitId = ui.bannerUnitId.value.trim();
  if (unitId.length === 0) {
    log('Provide a banner ad unit ID before loading.');
    return;
  }
  const position = ui.bannerPosition.value === 'top' ? 'top' : 'bottom';
  try {
    const banner = ensureBannerInstance(unitId, position);
    await banner.load();
    log('Banner load requested.', { unitId, position });
  } catch (error) {
    log('Failed to load banner.', error);
  }
};

const showBanner = async () => {
  const unitId = ui.bannerUnitId.value.trim();
  if (unitId.length === 0) {
    log('Provide a banner ad unit ID before showing.');
    return;
  }
  const position = ui.bannerPosition.value === 'top' ? 'top' : 'bottom';
  try {
    const banner = ensureBannerInstance(unitId, position);
    await banner.show();
    log('Banner show requested.', { unitId, position });
  } catch (error) {
    log('Failed to show banner.', error);
  }
};

const hideBanner = async () => {
  const position = ui.bannerPosition.value === 'top' ? 'top' : 'bottom';
  const bannerAd = position === 'top' ? bannerAdTop : bannerAdBottom;
  
  if (!bannerAd) {
    log(`No ${position} banner ad initialised yet.`);
    return;
  }
  try {
    await bannerAd.hide();
    log(`Banner hide requested for ${position} banner.`);
  } catch (error) {
    log(`Failed to hide ${position} banner.`, error);
  }
};

const hideBannerTop = async () => {
  if (!bannerAdTop) {
    log('No top banner ad initialised yet.');
    return;
  }
  try {
    await bannerAdTop.hide();
    log('Top banner hide requested.');
  } catch (error) {
    log('Failed to hide top banner.', error);
  }
};

const hideBannerBottom = async () => {
  if (!bannerAdBottom) {
    log('No bottom banner ad initialised yet.');
    return;
  }
  try {
    await bannerAdBottom.hide();
    log('Bottom banner hide requested.');
  } catch (error) {
    log('Failed to hide bottom banner.', error);
  }
};

const ensureInterstitialInstance = (unitId) => {
  if (!interstitialAd || interstitialConfig.unitId !== unitId) {
    interstitialAd = new InterstitialAd({ adUnitId: unitId });
    interstitialConfig = { unitId };
  }
  return interstitialAd;
};

const loadInterstitial = async () => {
  const unitId = ui.interstitialUnitId.value.trim();
  if (unitId.length === 0) {
    log('Provide an interstitial ad unit ID before loading.');
    return;
  }
  try {
    const ad = ensureInterstitialInstance(unitId);
    await ad.load();
    log('Interstitial load requested.', { unitId });
  } catch (error) {
    log('Failed to load interstitial.', error);
  }
};

const showInterstitial = async () => {
  const unitId = ui.interstitialUnitId.value.trim();
  if (unitId.length === 0) {
    log('Provide an interstitial ad unit ID before showing.');
    return;
  }
  try {
    const ad = ensureInterstitialInstance(unitId);
    await ad.show();
    log('Interstitial show requested.', { unitId });
  } catch (error) {
    log('Failed to show interstitial.', error);
  }
};

const ensureRewardedInstance = (unitId) => {
  if (!rewardedAd || rewardedConfig.unitId !== unitId) {
    rewardedAd = new RewardedAd({ adUnitId: unitId });
    rewardedConfig = { unitId };
  }
  return rewardedAd;
};

const loadRewarded = async () => {
  const unitId = ui.rewardedUnitId.value.trim();
  if (unitId.length === 0) {
    log('Provide a rewarded ad unit ID before loading.');
    return;
  }
  try {
    const ad = ensureRewardedInstance(unitId);
    await ad.load();
    log('Rewarded load requested.', { unitId });
  } catch (error) {
    log('Failed to load rewarded ad.', error);
  }
};

const showRewarded = async () => {
  const unitId = ui.rewardedUnitId.value.trim();
  if (unitId.length === 0) {
    log('Provide a rewarded ad unit ID before showing.');
    return;
  }
  try {
    const ad = ensureRewardedInstance(unitId);
    await ad.show();
    log('Rewarded show requested.', { unitId });
  } catch (error) {
    log('Failed to show rewarded ad.', error);
  }
};

const getTrackingStatus = async () => {
  try {
    const status = await AdMob.trackingAuthorizationStatus();
    log('Tracking authorisation status.', status);
  } catch (error) {
    log('Failed to fetch tracking status.', error);
  }
};

const requestTracking = async () => {
  try {
    const status = await AdMob.requestTrackingAuthorization();
    log('Tracking authorisation request result.', status);
  } catch (error) {
    log('Failed to request tracking authorisation.', error);
  }
};

ui.start.addEventListener('click', () => {
  startAdMob().catch((error) => log('Unexpected start error', error));
});
ui.configure.addEventListener('click', () => {
  applyAppConfig().catch((error) => log('Unexpected configure error', error));
});
ui.requestConfig.addEventListener('click', () => {
  applyRequestConfig().catch((error) => log('Unexpected request config error', error));
});
ui.bannerLoad.addEventListener('click', () => {
  loadBanner().catch((error) => log('Unexpected banner load error', error));
});
ui.bannerShow.addEventListener('click', () => {
  showBanner().catch((error) => log('Unexpected banner show error', error));
});
ui.bannerHide.addEventListener('click', () => {
  hideBanner().catch((error) => log('Unexpected banner hide error', error));
});
ui.bannerHideTop.addEventListener('click', () => {
  hideBannerTop().catch((error) => log('Unexpected top banner hide error', error));
});
ui.bannerHideBottom.addEventListener('click', () => {
  hideBannerBottom().catch((error) => log('Unexpected bottom banner hide error', error));
});
ui.interstitialLoad.addEventListener('click', () => {
  loadInterstitial().catch((error) => log('Unexpected interstitial load error', error));
});
ui.interstitialShow.addEventListener('click', () => {
  showInterstitial().catch((error) => log('Unexpected interstitial show error', error));
});
ui.rewardedLoad.addEventListener('click', () => {
  loadRewarded().catch((error) => log('Unexpected rewarded load error', error));
});
ui.rewardedShow.addEventListener('click', () => {
  showRewarded().catch((error) => log('Unexpected rewarded show error', error));
});
ui.trackingStatus.addEventListener('click', () => {
  getTrackingStatus().catch((error) => log('Unexpected tracking status error', error));
});
ui.requestTracking.addEventListener('click', () => {
  requestTracking().catch((error) => log('Unexpected tracking request error', error));
});
ui.removeListeners.addEventListener('click', () => {
  removeEventListeners().catch((error) => log('Unexpected listener removal error', error));
});
ui.clearLog.addEventListener('click', () => {
  ui.log.textContent = 'Logs cleared.';
});

registerEventListeners();
log('AdMob playground ready. Start the SDK before requesting ads.');
