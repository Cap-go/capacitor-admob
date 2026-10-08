import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { AdMob, FeedAd, AdMobPlusEvents } from '@capgo/capacitor-admob';

const NATIVE_TEST_UNIT = 'ca-app-pub-3940256099942544/2247696110';
const BANNER_TEST_UNIT = 'ca-app-pub-3940256099942544/6300978111';

const feedLog = document.getElementById('feedLog');
const feedList = document.getElementById('feedList');

const feedAds = [];
const attachedFeedSlotKeys = new Set();
let feedAttachInProgress = false;

const logFeed = (message, details) => {
  const stamp = new Date().toISOString().split('T')[1].replace('Z', '');
  const extra = details ? `\n${JSON.stringify(details, null, 2)}` : '';
  const line = `[${stamp}] ${message}${extra}`;
  if (feedLog.textContent.startsWith('Feed events')) {
    feedLog.textContent = line;
  } else {
    feedLog.textContent = `${line}\n\n${feedLog.textContent}`;
  }
};

const samplePosts = [
  { title: 'Morning briefing', body: 'Markets opened higher as tech led gains across major indices.' },
  { title: 'Local weather', body: 'Sunny spells this afternoon with a light breeze from the west.' },
  { title: 'Community note', body: 'The riverside path reopens after maintenance work wraps up Friday.' },
  { title: 'Weekend picks', body: 'Three pop-up food stalls worth visiting before they move on.' },
  { title: 'Sports roundup', body: 'Late goal seals a draw after a tense second half.' },
  { title: 'Travel tip', body: 'Off-peak trains run every twenty minutes on Sundays.' },
];

const ciFeedDemo = import.meta.env.VITE_CI_FEED === '1';

const buildFeed = () => {
  feedList.innerHTML = '';
  let adIndex = 0;
  const posts = ciFeedDemo ? samplePosts.slice(0, 2) : samplePosts;

  posts.forEach((post, index) => {
    const card = document.createElement('article');
    card.className = 'feed-card';
    card.innerHTML = `<h3>${post.title}</h3><p>${post.body}</p>`;
    feedList.appendChild(card);

    if (index % 2 === 1) {
      const slot = document.createElement('div');
      slot.className = 'feed-ad-slot';
      slot.dataset.adIndex = String(adIndex);
      slot.innerHTML =
        '<span class="feed-ad-label">Sponsored (native overlay)</span><div class="feed-ad-placeholder"></div>';
      feedList.appendChild(slot);
      adIndex += 1;
    }
  });

  const bannerSlot = document.createElement('div');
  bannerSlot.className = 'feed-ad-slot banner';
  bannerSlot.dataset.adIndex = String(adIndex);
  bannerSlot.innerHTML =
    '<span class="feed-ad-label">Sponsored (banner overlay)</span><div class="feed-ad-placeholder banner"></div>';
  feedList.appendChild(bannerSlot);
};

const attachFeedAds = async () => {
  if (!Capacitor.isNativePlatform()) {
    logFeed('Feed overlays require a native build. Placeholders are still visible on web.');
    return;
  }

  if (feedAttachInProgress) {
    logFeed('Feed attach already in progress');
    return;
  }

  const slots = [...feedList.querySelectorAll('.feed-ad-slot')].filter((slot) => {
    const positionKey = `feed-slot-${slot.dataset.adIndex}`;
    return !attachedFeedSlotKeys.has(positionKey);
  });

  if (slots.length === 0) {
    logFeed('All feed slots already attached');
    return;
  }

  feedAttachInProgress = true;

  try {
    await AdMob.start();

    for (const slot of slots) {
      const placeholder = slot.querySelector('.feed-ad-placeholder');
      if (!placeholder) continue;

      const isBanner = slot.classList.contains('banner');
      const positionKey = `feed-slot-${slot.dataset.adIndex}`;

      const feedAd = new FeedAd({
        format: isBanner ? 'banner' : 'native',
        adUnitId: isBanner ? BANNER_TEST_UNIT : NATIVE_TEST_UNIT,
        positionKey,
        autoRefreshMs: ciFeedDemo ? undefined : 60000,
        nativeStyle: {
          backgroundColor: '#1c1c1c',
          headlineTextColor: '#ffffff',
          bodyTextColor: '#d0d0d0',
          ctaBackgroundColor: '#2563eb',
          ctaTextColor: '#ffffff',
        },
      });

      try {
        await feedAd.attachTo(placeholder);
        feedAds.push(feedAd);
        attachedFeedSlotKeys.add(positionKey);
        const minHeight = isBanner ? 60 : 280;
        placeholder.style.minHeight = `${minHeight}px`;
        logFeed(`Attached ${positionKey}`, { format: isBanner ? 'banner' : 'native' });
      } catch (error) {
        await feedAd.destroy().catch(() => undefined);
        logFeed(`Failed to attach ${positionKey}`, error);
      }
    }
  } finally {
    feedAttachInProgress = false;
  }
};

const registerFeedListeners = () => {
  const names = [
    AdMobPlusEvents.FeedLoad,
    AdMobPlusEvents.FeedLoadFail,
    AdMobPlusEvents.FeedImpression,
    AdMobPlusEvents.FeedClick,
    AdMobPlusEvents.FeedOpen,
    AdMobPlusEvents.FeedClose,
    AdMobPlusEvents.FeedRefresh,
  ];
  names.forEach((eventName) => {
    AdMob.addListener(eventName, (event) => {
      logFeed(eventName, event);
    });
  });
};

buildFeed();
registerFeedListeners();

document.getElementById('feedStartButton')?.addEventListener('click', () => {
  attachFeedAds().catch((error) => logFeed('Feed setup failed', error));
});

document.getElementById('feedDestroyButton')?.addEventListener('click', () => {
  Promise.all(feedAds.map((ad) => ad.destroy()))
    .then(() => {
      feedAds.length = 0;
      attachedFeedSlotKeys.clear();
      logFeed('All feed ads destroyed');
    })
    .catch((error) => logFeed('Destroy failed', error));
});

if (ciFeedDemo && Capacitor.isNativePlatform()) {
  void SplashScreen.hide();
  void CapacitorUpdater.notifyAppReady().catch(() => undefined);
  window.setTimeout(() => {
    document.getElementById('feedSection')?.scrollIntoView({ block: 'start' });
    console.info('CAPGO_CI_FEED_SECTION_VISIBLE');
    attachFeedAds()
      .then(() => {
        const nativeSlot = feedList.querySelector('.feed-ad-slot:not(.banner)');
        const bannerSlot = feedList.querySelector('.feed-ad-slot.banner');
        nativeSlot?.scrollIntoView({ block: 'center' });
        console.info('CAPGO_CI_NATIVE_SLOT_READY');
        window.setTimeout(() => {
          bannerSlot?.scrollIntoView({ block: 'center' });
          console.info('CAPGO_CI_BANNER_SLOT_READY');
        }, 3000);
      })
      .catch((error) => logFeed('CI feed setup failed', error));
  }, 6000);
}
