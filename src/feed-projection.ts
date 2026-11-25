const escapeSelectorId = (value: string): string => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  if (value === '-') {
    return '\\-';
  }
  if (/^-[0-9]/.test(value)) {
    const rest = value.slice(2).replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
    return `\\3${value[1]} ${rest}`;
  }
  let escaped = value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
  if (/^[0-9]/.test(escaped)) {
    escaped = `\\3${escaped[0]} ${escaped.slice(1)}`;
  }
  return escaped;
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
