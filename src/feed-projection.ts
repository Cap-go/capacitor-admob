const escapeSelectorId = (value: string): string => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
};

/** Assign a stable CSS selector for WebView Native UI Engine DOM binding. */
export const ensureFeedProjectionSelector = (element: HTMLElement): string => {
  if (!element.id) {
    const random =
      typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).slice(2, 12);
    element.id = `capgo-feed-ad-${random}`;
  }
  return `#${escapeSelectorId(element.id)}`;
};
