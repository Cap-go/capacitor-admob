(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const scriptRel = "modulepreload";
const assetsURL = function(dep) {
  return "/" + dep;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    let allSettled = function(promises$2) {
      return Promise.all(promises$2.map((p) => Promise.resolve(p).then((value$1) => ({
        status: "fulfilled",
        value: value$1
      }), (reason) => ({
        status: "rejected",
        reason
      }))));
    };
    document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = allSettled(deps.map((dep) => {
      dep = assetsURL(dep);
      if (dep in seen) return;
      seen[dep] = true;
      const isCss = dep.endsWith(".css");
      const cssSelector = isCss ? '[rel="stylesheet"]' : "";
      if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
      const link = document.createElement("link");
      link.rel = isCss ? "stylesheet" : scriptRel;
      if (!isCss) link.as = "script";
      link.crossOrigin = "";
      link.href = dep;
      if (cspNonce) link.setAttribute("nonce", cspNonce);
      document.head.appendChild(link);
      if (isCss) return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
      });
    }));
  }
  function handlePreloadError(err$2) {
    const e$1 = new Event("vite:preloadError", { cancelable: true });
    e$1.payload = err$2;
    window.dispatchEvent(e$1);
    if (!e$1.defaultPrevented) throw err$2;
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
var ExceptionCode;
(function(ExceptionCode2) {
  ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
  ExceptionCode2["Unavailable"] = "UNAVAILABLE";
})(ExceptionCode || (ExceptionCode = {}));
class CapacitorException extends Error {
  constructor(message, code, data) {
    super(message);
    this.message = message;
    this.code = code;
    this.data = data;
  }
}
const getPlatformId = (win) => {
  var _a, _b;
  if (win === null || win === void 0 ? void 0 : win.androidBridge) {
    return "android";
  } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
    return "ios";
  } else {
    return "web";
  }
};
const createCapacitor = (win) => {
  const capCustomPlatform = win.CapacitorCustomPlatform || null;
  const cap = win.Capacitor || {};
  const Plugins = cap.Plugins = cap.Plugins || {};
  const getPlatform = () => {
    return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
  };
  const isNativePlatform = () => getPlatform() !== "web";
  const isPluginAvailable = (pluginName) => {
    const plugin = registeredPlugins.get(pluginName);
    if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
      return true;
    }
    if (getPluginHeader(pluginName)) {
      return true;
    }
    return false;
  };
  const getPluginHeader = (pluginName) => {
    var _a;
    return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
  };
  const handleError = (err) => win.console.error(err);
  const registeredPlugins = /* @__PURE__ */ new Map();
  const registerPlugin2 = (pluginName, jsImplementations = {}) => {
    const registeredPlugin = registeredPlugins.get(pluginName);
    if (registeredPlugin) {
      console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
      return registeredPlugin.proxy;
    }
    const platform = getPlatform();
    const pluginHeader = getPluginHeader(pluginName);
    let jsImplementation;
    const loadPluginImplementation = async () => {
      if (!jsImplementation && platform in jsImplementations) {
        jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
      } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
        jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
      }
      return jsImplementation;
    };
    const createPluginMethod = (impl, prop) => {
      var _a, _b;
      if (pluginHeader) {
        const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
        if (methodHeader) {
          if (methodHeader.rtype === "promise") {
            return (options) => cap.nativePromise(pluginName, prop.toString(), options);
          } else {
            return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
          }
        } else if (impl) {
          return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
        }
      } else if (impl) {
        return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
      } else {
        throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
      }
    };
    const createPluginMethodWrapper = (prop) => {
      let remove;
      const wrapper = (...args) => {
        const p = loadPluginImplementation().then((impl) => {
          const fn = createPluginMethod(impl, prop);
          if (fn) {
            const p2 = fn(...args);
            remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
            return p2;
          } else {
            throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
          }
        });
        if (prop === "addListener") {
          p.remove = async () => remove();
        }
        return p;
      };
      wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
      Object.defineProperty(wrapper, "name", {
        value: prop,
        writable: false,
        configurable: false
      });
      return wrapper;
    };
    const addListener = createPluginMethodWrapper("addListener");
    const removeListener = createPluginMethodWrapper("removeListener");
    const addListenerNative = (eventName, callback) => {
      const call = addListener({ eventName }, callback);
      const remove = async () => {
        const callbackId = await call;
        removeListener({
          eventName,
          callbackId
        }, callback);
      };
      const p = new Promise((resolve) => call.then(() => resolve({ remove })));
      p.remove = async () => {
        console.warn(`Using addListener() without 'await' is deprecated.`);
        await remove();
      };
      return p;
    };
    const proxy = new Proxy({}, {
      get(_, prop) {
        switch (prop) {
          // https://github.com/facebook/react/issues/20030
          case "$$typeof":
            return void 0;
          case "toJSON":
            return () => ({});
          case "addListener":
            return pluginHeader ? addListenerNative : addListener;
          case "removeListener":
            return removeListener;
          default:
            return createPluginMethodWrapper(prop);
        }
      }
    });
    Plugins[pluginName] = proxy;
    registeredPlugins.set(pluginName, {
      name: pluginName,
      proxy,
      platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
    });
    return proxy;
  };
  if (!cap.convertFileSrc) {
    cap.convertFileSrc = (filePath) => filePath;
  }
  cap.getPlatform = getPlatform;
  cap.handleError = handleError;
  cap.isNativePlatform = isNativePlatform;
  cap.isPluginAvailable = isPluginAvailable;
  cap.registerPlugin = registerPlugin2;
  cap.Exception = CapacitorException;
  cap.DEBUG = !!cap.DEBUG;
  cap.isLoggingEnabled = !!cap.isLoggingEnabled;
  return cap;
};
const initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
const Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
const registerPlugin = Capacitor.registerPlugin;
class WebPlugin {
  constructor() {
    this.listeners = {};
    this.retainedEventArguments = {};
    this.windowListeners = {};
  }
  addListener(eventName, listenerFunc) {
    let firstListener = false;
    const listeners = this.listeners[eventName];
    if (!listeners) {
      this.listeners[eventName] = [];
      firstListener = true;
    }
    this.listeners[eventName].push(listenerFunc);
    const windowListener = this.windowListeners[eventName];
    if (windowListener && !windowListener.registered) {
      this.addWindowListener(windowListener);
    }
    if (firstListener) {
      this.sendRetainedArgumentsForEvent(eventName);
    }
    const remove = async () => this.removeListener(eventName, listenerFunc);
    const p = Promise.resolve({ remove });
    return p;
  }
  async removeAllListeners() {
    this.listeners = {};
    for (const listener in this.windowListeners) {
      this.removeWindowListener(this.windowListeners[listener]);
    }
    this.windowListeners = {};
  }
  notifyListeners(eventName, data, retainUntilConsumed) {
    const listeners = this.listeners[eventName];
    if (!listeners) {
      if (retainUntilConsumed) {
        let args = this.retainedEventArguments[eventName];
        if (!args) {
          args = [];
        }
        args.push(data);
        this.retainedEventArguments[eventName] = args;
      }
      return;
    }
    listeners.forEach((listener) => listener(data));
  }
  hasListeners(eventName) {
    var _a;
    return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
  }
  registerWindowListener(windowEventName, pluginEventName) {
    this.windowListeners[pluginEventName] = {
      registered: false,
      windowEventName,
      pluginEventName,
      handler: (event) => {
        this.notifyListeners(pluginEventName, event);
      }
    };
  }
  unimplemented(msg = "not implemented") {
    return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
  }
  unavailable(msg = "not available") {
    return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
  }
  async removeListener(eventName, listenerFunc) {
    const listeners = this.listeners[eventName];
    if (!listeners) {
      return;
    }
    const index = listeners.indexOf(listenerFunc);
    this.listeners[eventName].splice(index, 1);
    if (!this.listeners[eventName].length) {
      this.removeWindowListener(this.windowListeners[eventName]);
    }
  }
  addWindowListener(handle) {
    window.addEventListener(handle.windowEventName, handle.handler);
    handle.registered = true;
  }
  removeWindowListener(handle) {
    if (!handle) {
      return;
    }
    window.removeEventListener(handle.windowEventName, handle.handler);
    handle.registered = false;
  }
  sendRetainedArgumentsForEvent(eventName) {
    const args = this.retainedEventArguments[eventName];
    if (!args) {
      return;
    }
    delete this.retainedEventArguments[eventName];
    args.forEach((arg) => {
      this.notifyListeners(eventName, arg);
    });
  }
}
const encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
const decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
class CapacitorCookiesPluginWeb extends WebPlugin {
  async getCookies() {
    const cookies = document.cookie;
    const cookieMap = {};
    cookies.split(";").forEach((cookie) => {
      if (cookie.length <= 0)
        return;
      let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
      key = decode(key).trim();
      value = decode(value).trim();
      cookieMap[key] = value;
    });
    return cookieMap;
  }
  async setCookie(options) {
    try {
      const encodedKey = encode(options.key);
      const encodedValue = encode(options.value);
      const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
      const path = (options.path || "/").replace("path=", "");
      const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
      document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async deleteCookie(options) {
    try {
      document.cookie = `${options.key}=; Max-Age=0`;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async clearCookies() {
    try {
      const cookies = document.cookie.split(";") || [];
      for (const cookie of cookies) {
        document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async clearAllCookies() {
    try {
      await this.clearCookies();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
registerPlugin("CapacitorCookies", {
  web: () => new CapacitorCookiesPluginWeb()
});
const readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const base64String = reader.result;
    resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
  };
  reader.onerror = (error) => reject(error);
  reader.readAsDataURL(blob);
});
const normalizeHttpHeaders = (headers = {}) => {
  const originalKeys = Object.keys(headers);
  const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
  const normalized = loweredKeys.reduce((acc, key, index) => {
    acc[key] = headers[originalKeys[index]];
    return acc;
  }, {});
  return normalized;
};
const buildUrlParams = (params, shouldEncode = true) => {
  if (!params)
    return null;
  const output = Object.entries(params).reduce((accumulator, entry) => {
    const [key, value] = entry;
    let encodedValue;
    let item;
    if (Array.isArray(value)) {
      item = "";
      value.forEach((str) => {
        encodedValue = shouldEncode ? encodeURIComponent(str) : str;
        item += `${key}=${encodedValue}&`;
      });
      item.slice(0, -1);
    } else {
      encodedValue = shouldEncode ? encodeURIComponent(value) : value;
      item = `${key}=${encodedValue}`;
    }
    return `${accumulator}&${item}`;
  }, "");
  return output.substr(1);
};
const buildRequestInit = (options, extra = {}) => {
  const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
  const headers = normalizeHttpHeaders(options.headers);
  const type = headers["content-type"] || "";
  if (typeof options.data === "string") {
    output.body = options.data;
  } else if (type.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.data || {})) {
      params.set(key, value);
    }
    output.body = params.toString();
  } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
    const form = new FormData();
    if (options.data instanceof FormData) {
      options.data.forEach((value, key) => {
        form.append(key, value);
      });
    } else {
      for (const key of Object.keys(options.data)) {
        form.append(key, options.data[key]);
      }
    }
    output.body = form;
    const headers2 = new Headers(output.headers);
    headers2.delete("content-type");
    output.headers = headers2;
  } else if (type.includes("application/json") || typeof options.data === "object") {
    output.body = JSON.stringify(options.data);
  }
  return output;
};
class CapacitorHttpPluginWeb extends WebPlugin {
  /**
   * Perform an Http request given a set of options
   * @param options Options to build the HTTP request
   */
  async request(options) {
    const requestInit = buildRequestInit(options, options.webFetchExtra);
    const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
    const url = urlParams ? `${options.url}?${urlParams}` : options.url;
    const response = await fetch(url, requestInit);
    const contentType = response.headers.get("content-type") || "";
    let { responseType = "text" } = response.ok ? options : {};
    if (contentType.includes("application/json")) {
      responseType = "json";
    }
    let data;
    let blob;
    switch (responseType) {
      case "arraybuffer":
      case "blob":
        blob = await response.blob();
        data = await readBlobAsBase64(blob);
        break;
      case "json":
        data = await response.json();
        break;
      case "document":
      case "text":
      default:
        data = await response.text();
    }
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return {
      data,
      headers,
      status: response.status,
      url: response.url
    };
  }
  /**
   * Perform an Http GET request given a set of options
   * @param options Options to build the HTTP request
   */
  async get(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
  }
  /**
   * Perform an Http POST request given a set of options
   * @param options Options to build the HTTP request
   */
  async post(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
  }
  /**
   * Perform an Http PUT request given a set of options
   * @param options Options to build the HTTP request
   */
  async put(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
  }
  /**
   * Perform an Http PATCH request given a set of options
   * @param options Options to build the HTTP request
   */
  async patch(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
  }
  /**
   * Perform an Http DELETE request given a set of options
   * @param options Options to build the HTTP request
   */
  async delete(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
  }
}
registerPlugin("CapacitorHttp", {
  web: () => new CapacitorHttpPluginWeb()
});
var SystemBarsStyle;
(function(SystemBarsStyle2) {
  SystemBarsStyle2["Dark"] = "DARK";
  SystemBarsStyle2["Light"] = "LIGHT";
  SystemBarsStyle2["Default"] = "DEFAULT";
})(SystemBarsStyle || (SystemBarsStyle = {}));
var SystemBarType;
(function(SystemBarType2) {
  SystemBarType2["StatusBar"] = "StatusBar";
  SystemBarType2["NavigationBar"] = "NavigationBar";
})(SystemBarType || (SystemBarType = {}));
class SystemBarsPluginWeb extends WebPlugin {
  async setStyle() {
    this.unavailable("not available for web");
  }
  async setAnimation() {
    this.unavailable("not available for web");
  }
  async show() {
    this.unavailable("not available for web");
  }
  async hide() {
    this.unavailable("not available for web");
  }
}
registerPlugin("SystemBars", {
  web: () => new SystemBarsPluginWeb()
});
const KEEP_FLAG_KEY = "__capgo_keep_url_path_after_reload";
const HISTORY_STORAGE_KEY = "__capgo_history_stack__";
const MAX_STACK_ENTRIES = 100;
const isBrowser = typeof window !== "undefined" && typeof document !== "undefined" && typeof history !== "undefined";
if (isBrowser) {
  const win = window;
  if (!win.__capgoHistoryPatched) {
    win.__capgoHistoryPatched = true;
    const isFeatureConfigured = () => {
      try {
        if (win.__capgoKeepUrlPathAfterReload) {
          return true;
        }
      } catch (err) {
      }
      try {
        return window.localStorage.getItem(KEEP_FLAG_KEY) === "1";
      } catch (err) {
        return false;
      }
    };
    const readStored = () => {
      try {
        const raw = window.sessionStorage.getItem(HISTORY_STORAGE_KEY);
        if (!raw) {
          return { stack: [], index: -1 };
        }
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.stack) || typeof parsed.index !== "number") {
          return { stack: [], index: -1 };
        }
        return parsed;
      } catch (err) {
        return { stack: [], index: -1 };
      }
    };
    const writeStored = (stack, index) => {
      try {
        window.sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ stack, index }));
      } catch (err) {
      }
    };
    const clearStored = () => {
      try {
        window.sessionStorage.removeItem(HISTORY_STORAGE_KEY);
      } catch (err) {
      }
    };
    const normalize = (url) => {
      try {
        const base = url !== null && url !== void 0 ? url : window.location.href;
        const parsed = new URL(base instanceof URL ? base.toString() : base, window.location.href);
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch (err) {
        return null;
      }
    };
    const trimStack = (stack, index) => {
      if (stack.length <= MAX_STACK_ENTRIES) {
        return { stack, index };
      }
      const start2 = stack.length - MAX_STACK_ENTRIES;
      const trimmed = stack.slice(start2);
      const adjustedIndex = Math.max(0, index - start2);
      return { stack: trimmed, index: adjustedIndex };
    };
    const runWhenReady = (fn) => {
      if (document.readyState === "complete" || document.readyState === "interactive") {
        fn();
      } else {
        window.addEventListener("DOMContentLoaded", fn, { once: true });
      }
    };
    let featureActive = false;
    let isRestoring = false;
    let restoreScheduled = false;
    const ensureCurrentTracked = () => {
      if (!featureActive) {
        return;
      }
      const stored = readStored();
      const current = normalize();
      if (!current) {
        return;
      }
      if (stored.stack.length === 0) {
        stored.stack.push(current);
        stored.index = 0;
        writeStored(stored.stack, stored.index);
        return;
      }
      if (stored.index < 0 || stored.index >= stored.stack.length) {
        stored.index = stored.stack.length - 1;
      }
      if (stored.stack[stored.index] !== current) {
        stored.stack[stored.index] = current;
        writeStored(stored.stack, stored.index);
      }
    };
    const record = (url, replace) => {
      if (!featureActive || isRestoring) {
        return;
      }
      const normalized = normalize(url);
      if (!normalized) {
        return;
      }
      let { stack, index } = readStored();
      if (stack.length === 0) {
        stack.push(normalized);
        index = stack.length - 1;
      } else if (replace) {
        if (index < 0 || index >= stack.length) {
          index = stack.length - 1;
        }
        stack[index] = normalized;
      } else {
        if (index >= stack.length - 1) {
          stack.push(normalized);
          index = stack.length - 1;
        } else {
          stack = stack.slice(0, index + 1);
          stack.push(normalized);
          index = stack.length - 1;
        }
      }
      ({ stack, index } = trimStack(stack, index));
      writeStored(stack, index);
    };
    const restoreHistory = () => {
      if (!featureActive || isRestoring) {
        return;
      }
      const stored = readStored();
      if (stored.stack.length === 0) {
        ensureCurrentTracked();
        return;
      }
      const targetIndex = stored.index >= 0 && stored.index < stored.stack.length ? stored.index : stored.stack.length - 1;
      const normalizedCurrent = normalize();
      if (stored.stack.length === 1 && normalizedCurrent === stored.stack[0]) {
        return;
      }
      const firstEntry = stored.stack[0];
      if (!firstEntry) {
        return;
      }
      isRestoring = true;
      try {
        history.replaceState(history.state, document.title, firstEntry);
        for (let i = 1; i < stored.stack.length; i += 1) {
          history.pushState(history.state, document.title, stored.stack[i]);
        }
      } catch (err) {
        isRestoring = false;
        return;
      }
      isRestoring = false;
      const currentIndex = stored.stack.length - 1;
      const offset = targetIndex - currentIndex;
      if (offset !== 0) {
        history.go(offset);
      } else {
        history.replaceState(history.state, document.title, stored.stack[targetIndex]);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    };
    const scheduleRestore = () => {
      if (!featureActive || restoreScheduled) {
        return;
      }
      restoreScheduled = true;
      runWhenReady(() => {
        restoreScheduled = false;
        restoreHistory();
      });
    };
    let originalPushState = null;
    let originalReplaceState = null;
    const popstateHandler = () => {
      if (!featureActive || isRestoring) {
        return;
      }
      const normalized = normalize();
      if (!normalized) {
        return;
      }
      const stored = readStored();
      const idx = stored.stack.lastIndexOf(normalized);
      if (idx >= 0) {
        stored.index = idx;
      } else {
        stored.stack.push(normalized);
        stored.index = stored.stack.length - 1;
      }
      const trimmed = trimStack(stored.stack, stored.index);
      writeStored(trimmed.stack, trimmed.index);
    };
    const patchHistory = () => {
      if (originalPushState && originalReplaceState) {
        return;
      }
      originalPushState = history.pushState;
      originalReplaceState = history.replaceState;
      history.pushState = function pushStatePatched(state, title, url) {
        const result = originalPushState === null || originalPushState === void 0 ? void 0 : originalPushState.call(history, state, title, url);
        record(url, false);
        return result;
      };
      history.replaceState = function replaceStatePatched(state, title, url) {
        const result = originalReplaceState === null || originalReplaceState === void 0 ? void 0 : originalReplaceState.call(history, state, title, url);
        record(url, true);
        return result;
      };
      window.addEventListener("popstate", popstateHandler);
    };
    const unpatchHistory = () => {
      if (originalPushState) {
        history.pushState = originalPushState;
        originalPushState = null;
      }
      if (originalReplaceState) {
        history.replaceState = originalReplaceState;
        originalReplaceState = null;
      }
      window.removeEventListener("popstate", popstateHandler);
    };
    const setFeatureActive = (enabled) => {
      if (featureActive === enabled) {
        if (featureActive) {
          ensureCurrentTracked();
          scheduleRestore();
        }
        return;
      }
      featureActive = enabled;
      if (featureActive) {
        patchHistory();
        ensureCurrentTracked();
        scheduleRestore();
      } else {
        unpatchHistory();
        clearStored();
      }
    };
    window.addEventListener("CapacitorUpdaterKeepUrlPathAfterReload", (event) => {
      var _a;
      const evt = event;
      const enabled = (_a = evt === null || evt === void 0 ? void 0 : evt.detail) === null || _a === void 0 ? void 0 : _a.enabled;
      if (typeof enabled === "boolean") {
        win.__capgoKeepUrlPathAfterReload = enabled;
        setFeatureActive(enabled);
      } else {
        win.__capgoKeepUrlPathAfterReload = true;
        setFeatureActive(true);
      }
    });
    setFeatureActive(isFeatureConfigured());
  }
}
var AppUpdateAvailability;
(function(AppUpdateAvailability2) {
  AppUpdateAvailability2[AppUpdateAvailability2["UNKNOWN"] = 0] = "UNKNOWN";
  AppUpdateAvailability2[AppUpdateAvailability2["UPDATE_NOT_AVAILABLE"] = 1] = "UPDATE_NOT_AVAILABLE";
  AppUpdateAvailability2[AppUpdateAvailability2["UPDATE_AVAILABLE"] = 2] = "UPDATE_AVAILABLE";
  AppUpdateAvailability2[AppUpdateAvailability2["UPDATE_IN_PROGRESS"] = 3] = "UPDATE_IN_PROGRESS";
})(AppUpdateAvailability || (AppUpdateAvailability = {}));
var FlexibleUpdateInstallStatus;
(function(FlexibleUpdateInstallStatus2) {
  FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["UNKNOWN"] = 0] = "UNKNOWN";
  FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["PENDING"] = 1] = "PENDING";
  FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["DOWNLOADING"] = 2] = "DOWNLOADING";
  FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["INSTALLING"] = 3] = "INSTALLING";
  FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["INSTALLED"] = 4] = "INSTALLED";
  FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["FAILED"] = 5] = "FAILED";
  FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["CANCELED"] = 6] = "CANCELED";
  FlexibleUpdateInstallStatus2[FlexibleUpdateInstallStatus2["DOWNLOADED"] = 11] = "DOWNLOADED";
})(FlexibleUpdateInstallStatus || (FlexibleUpdateInstallStatus = {}));
var AppUpdateResultCode;
(function(AppUpdateResultCode2) {
  AppUpdateResultCode2[AppUpdateResultCode2["OK"] = 0] = "OK";
  AppUpdateResultCode2[AppUpdateResultCode2["CANCELED"] = 1] = "CANCELED";
  AppUpdateResultCode2[AppUpdateResultCode2["FAILED"] = 2] = "FAILED";
  AppUpdateResultCode2[AppUpdateResultCode2["NOT_AVAILABLE"] = 3] = "NOT_AVAILABLE";
  AppUpdateResultCode2[AppUpdateResultCode2["NOT_ALLOWED"] = 4] = "NOT_ALLOWED";
  AppUpdateResultCode2[AppUpdateResultCode2["INFO_MISSING"] = 5] = "INFO_MISSING";
})(AppUpdateResultCode || (AppUpdateResultCode = {}));
const CapacitorUpdater = registerPlugin("CapacitorUpdater", {
  web: () => __vitePreload(() => import("./web-CA54OxjS.js"), true ? [] : void 0).then((m) => new m.CapacitorUpdaterWeb())
});
var MaxAdContentRating;
(function(MaxAdContentRating2) {
  MaxAdContentRating2["G"] = "G";
  MaxAdContentRating2["MA"] = "MA";
  MaxAdContentRating2["PG"] = "PG";
  MaxAdContentRating2["T"] = "T";
  MaxAdContentRating2["UNSPECIFIED"] = "";
})(MaxAdContentRating || (MaxAdContentRating = {}));
var TrackingAuthorizationStatus;
(function(TrackingAuthorizationStatus2) {
  TrackingAuthorizationStatus2[TrackingAuthorizationStatus2["notDetermined"] = 0] = "notDetermined";
  TrackingAuthorizationStatus2[TrackingAuthorizationStatus2["restricted"] = 1] = "restricted";
  TrackingAuthorizationStatus2[TrackingAuthorizationStatus2["denied"] = 2] = "denied";
  TrackingAuthorizationStatus2[TrackingAuthorizationStatus2["authorized"] = 3] = "authorized";
})(TrackingAuthorizationStatus || (TrackingAuthorizationStatus = {}));
var __classPrivateFieldGet = function(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = function(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var _MobileAd_created, _MobileAd_init, _BannerAd_loaded;
const AdMob = registerPlugin("AdMobPlus", {
  web: () => __vitePreload(() => import("./web-Cko6pmIW.js"), true ? [] : void 0).then((m) => new m.AdMobPlusWeb())
});
let started = false;
let startPromise = null;
const start = AdMob.start.bind(AdMob);
const ensureStarted = async () => {
  if (started)
    return;
  if (startPromise === null) {
    startPromise = start().then((result) => {
      started = true;
      return result;
    }).catch((error) => {
      startPromise = null;
      throw error;
    });
  }
  return startPromise;
};
AdMob.start = ensureStarted;
const adIsLoaded = AdMob.adIsLoaded.bind(AdMob);
AdMob.adIsLoaded = (async (...args) => {
  const result = await adIsLoaded(...args);
  return typeof result === "boolean" ? result : result.value === true;
});
class MobileAd {
  constructor(opts) {
    _MobileAd_created.set(this, false);
    _MobileAd_init.set(this, null);
    this.opts = opts;
    this.id = MobileAd.nextId();
    MobileAd.allAds[this.id] = this;
  }
  static nextId() {
    MobileAd.idCounter += 1;
    return MobileAd.idCounter;
  }
  get adUnitId() {
    return this.opts.adUnitId;
  }
  async isLoaded() {
    await this.init();
    return AdMob.adIsLoaded({ id: this.id });
  }
  async load() {
    await this.init();
    return AdMob.adLoad(Object.assign(Object.assign({}, this.opts), { id: this.id }));
  }
  async show() {
    await this.init();
    return AdMob.adShow({ id: this.id });
  }
  async hide() {
    await this.init();
    return AdMob.adHide({ id: this.id });
  }
  async init() {
    var _a;
    if (__classPrivateFieldGet(this, _MobileAd_created, "f"))
      return;
    if (!started) {
      await ensureStarted();
    }
    if (__classPrivateFieldGet(this, _MobileAd_init, "f") === null) {
      const cls = (_a = this.constructor.cls) !== null && _a !== void 0 ? _a : this.constructor.name;
      __classPrivateFieldSet(this, _MobileAd_init, AdMob.adCreate(Object.assign(Object.assign({}, this.opts), { id: this.id, cls })), "f");
    }
    await __classPrivateFieldGet(this, _MobileAd_init, "f");
    __classPrivateFieldSet(this, _MobileAd_created, true, "f");
  }
}
_MobileAd_created = /* @__PURE__ */ new WeakMap(), _MobileAd_init = /* @__PURE__ */ new WeakMap();
MobileAd.allAds = {};
MobileAd.idCounter = 0;
class BannerAd extends MobileAd {
  constructor(opts) {
    super(Object.assign({ position: "bottom" }, opts));
    _BannerAd_loaded.set(this, false);
  }
  isLoaded() {
    return super.isLoaded();
  }
  async load() {
    await super.load();
    __classPrivateFieldSet(this, _BannerAd_loaded, true, "f");
  }
  async show() {
    if (!__classPrivateFieldGet(this, _BannerAd_loaded, "f"))
      await this.load();
    await super.show();
  }
  hide() {
    return super.hide();
  }
}
_BannerAd_loaded = /* @__PURE__ */ new WeakMap();
BannerAd.cls = "BannerAd";
class InterstitialAd extends MobileAd {
  isLoaded() {
    return super.isLoaded();
  }
  async load() {
    return super.load();
  }
  async show() {
    return super.show();
  }
}
InterstitialAd.cls = "InterstitialAd";
class RewardedAd extends MobileAd {
  isLoaded() {
    return super.isLoaded();
  }
  async load() {
    return super.load();
  }
  async show() {
    return super.show();
  }
}
RewardedAd.cls = "RewardedAd";
class RewardedInterstitialAd extends MobileAd {
  isLoaded() {
    return super.isLoaded();
  }
  async load() {
    return super.load();
  }
  async show() {
    return super.show();
  }
}
RewardedInterstitialAd.cls = "RewardedInterstitialAd";
const ui = {
  start: document.getElementById("startButton"),
  configure: document.getElementById("configureButton"),
  requestConfig: document.getElementById("requestConfigButton"),
  appVolume: document.getElementById("appVolume"),
  contentRating: document.getElementById("contentRating"),
  testDeviceId: document.getElementById("testDeviceId"),
  appMuted: document.getElementById("appMuted"),
  sameAppKey: document.getElementById("sameAppKey"),
  childDirected: document.getElementById("childDirected"),
  underAge: document.getElementById("underAge"),
  bannerUnitId: document.getElementById("bannerUnitId"),
  bannerPosition: document.getElementById("bannerPosition"),
  bannerLoad: document.getElementById("bannerLoadButton"),
  bannerShow: document.getElementById("bannerShowButton"),
  bannerHide: document.getElementById("bannerHideButton"),
  bannerHideTop: document.getElementById("bannerHideTopButton"),
  bannerHideBottom: document.getElementById("bannerHideBottomButton"),
  interstitialUnitId: document.getElementById("interstitialUnitId"),
  interstitialLoad: document.getElementById("interstitialLoadButton"),
  interstitialShow: document.getElementById("interstitialShowButton"),
  rewardedUnitId: document.getElementById("rewardedUnitId"),
  rewardedLoad: document.getElementById("rewardedLoadButton"),
  rewardedShow: document.getElementById("rewardedShowButton"),
  trackingStatus: document.getElementById("trackingStatusButton"),
  requestTracking: document.getElementById("requestTrackingButton"),
  removeListeners: document.getElementById("removeListenersButton"),
  clearLog: document.getElementById("clearLogButton"),
  log: document.getElementById("logOutput")
};
let bannerAdTop = null;
let bannerAdBottom = null;
let bannerConfig = { unitId: "" };
let interstitialAd = null;
let interstitialConfig = { unitId: "" };
let rewardedAd = null;
let rewardedConfig = { unitId: "" };
let eventListenerHandles = [];
const eventNames = [
  "ad.click",
  "ad.dismiss",
  "ad.impression",
  "ad.load",
  "ad.loadfail",
  "ad.reward",
  "ad.show",
  "ad.showfail",
  "banner.click",
  "banner.close",
  "banner.impression",
  "banner.load",
  "banner.loadfail",
  "banner.open",
  "banner.sizechange",
  "interstitial.dismiss",
  "interstitial.impression",
  "interstitial.load",
  "interstitial.loadfail",
  "interstitial.show",
  "interstitial.showfail",
  "rewarded.dismiss",
  "rewarded.impression",
  "rewarded.load",
  "rewarded.loadfail",
  "rewarded.reward",
  "rewarded.show",
  "rewarded.showfail",
  "rewardedi.dismiss",
  "rewardedi.impression",
  "rewardedi.load",
  "rewardedi.loadfail",
  "rewardedi.reward",
  "rewardedi.show",
  "rewardedi.showfail"
];
const formatDetails = (details) => {
  if (details === void 0) return "";
  if (details === null) return "null";
  if (details instanceof Error) return `${details.message}
${details.stack ?? ""}`;
  if (typeof details === "object") {
    try {
      return JSON.stringify(details, null, 2);
    } catch (err) {
      return String(details);
    }
  }
  return String(details);
};
const log = (message, details) => {
  const now = /* @__PURE__ */ new Date();
  const timestamp = now.toISOString().split("T")[1].replace("Z", "");
  const detailText = details !== void 0 ? `
${formatDetails(details)}` : "";
  const entry = `[${timestamp}] ${message}${detailText}`;
  if (ui.log.textContent.startsWith("Logs will appear here.")) {
    ui.log.textContent = entry;
  } else {
    ui.log.textContent = `${entry}

${ui.log.textContent}`;
  }
  if (details !== void 0) {
    console.log(message, details);
  } else {
    console.log(message);
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
  log("AdMob listeners registered for SDK events.");
};
const removeEventListeners = async () => {
  if (eventListenerHandles.length === 0) {
    log("No listeners to remove.");
    return;
  }
  const handles = await Promise.all(eventListenerHandles);
  await Promise.allSettled(handles.map((handle) => handle.remove()));
  eventListenerHandles = [];
  log("All AdMob listeners removed. Reload to re-register.");
};
const startAdMob = async () => {
  try {
    await AdMob.start();
    log("AdMob SDK started.");
  } catch (error) {
    log("Failed to start AdMob.", error);
  }
};
const applyAppConfig = async () => {
  const volume = Math.min(1, Math.max(0, parseNumber(ui.appVolume.value, 0.5)));
  const muted = ui.appMuted.checked;
  try {
    await AdMob.configure({ appVolume: volume, appMuted: muted });
    log("App configuration applied.", { appVolume: volume, appMuted: muted });
  } catch (error) {
    log("Failed to apply app configuration.", error);
  }
};
const applyRequestConfig = async () => {
  const rating = ui.contentRating.value;
  const testIds = ui.testDeviceId.value.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
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
    log("Request configuration applied.", requestConfig);
  } catch (error) {
    log("Failed to apply request configuration.", error);
  }
};
const ensureBannerInstance = (unitId, position) => {
  if (position === "top") {
    if (!bannerAdTop || bannerConfig.unitId !== unitId) {
      bannerAdTop = new BannerAd({ adUnitId: unitId, position: "top" });
    }
    return bannerAdTop;
  } else {
    if (!bannerAdBottom || bannerConfig.unitId !== unitId) {
      bannerAdBottom = new BannerAd({ adUnitId: unitId, position: "bottom" });
    }
    return bannerAdBottom;
  }
};
const loadBanner = async () => {
  const unitId = ui.bannerUnitId.value.trim();
  if (unitId.length === 0) {
    log("Provide a banner ad unit ID before loading.");
    return;
  }
  const position = ui.bannerPosition.value === "top" ? "top" : "bottom";
  try {
    const banner = ensureBannerInstance(unitId, position);
    await banner.load();
    log("Banner load requested.", { unitId, position });
  } catch (error) {
    log("Failed to load banner.", error);
  }
};
const showBanner = async () => {
  const unitId = ui.bannerUnitId.value.trim();
  if (unitId.length === 0) {
    log("Provide a banner ad unit ID before showing.");
    return;
  }
  const position = ui.bannerPosition.value === "top" ? "top" : "bottom";
  try {
    const banner = ensureBannerInstance(unitId, position);
    await banner.show();
    log("Banner show requested.", { unitId, position });
  } catch (error) {
    log("Failed to show banner.", error);
  }
};
const hideBanner = async () => {
  const position = ui.bannerPosition.value === "top" ? "top" : "bottom";
  const bannerAd = position === "top" ? bannerAdTop : bannerAdBottom;
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
    log("No top banner ad initialised yet.");
    return;
  }
  try {
    await bannerAdTop.hide();
    log("Top banner hide requested.");
  } catch (error) {
    log("Failed to hide top banner.", error);
  }
};
const hideBannerBottom = async () => {
  if (!bannerAdBottom) {
    log("No bottom banner ad initialised yet.");
    return;
  }
  try {
    await bannerAdBottom.hide();
    log("Bottom banner hide requested.");
  } catch (error) {
    log("Failed to hide bottom banner.", error);
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
    log("Provide an interstitial ad unit ID before loading.");
    return;
  }
  try {
    const ad = ensureInterstitialInstance(unitId);
    await ad.load();
    log("Interstitial load requested.", { unitId });
  } catch (error) {
    log("Failed to load interstitial.", error);
  }
};
const showInterstitial = async () => {
  const unitId = ui.interstitialUnitId.value.trim();
  if (unitId.length === 0) {
    log("Provide an interstitial ad unit ID before showing.");
    return;
  }
  try {
    const ad = ensureInterstitialInstance(unitId);
    await ad.show();
    log("Interstitial show requested.", { unitId });
  } catch (error) {
    log("Failed to show interstitial.", error);
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
    log("Provide a rewarded ad unit ID before loading.");
    return;
  }
  try {
    const ad = ensureRewardedInstance(unitId);
    await ad.load();
    log("Rewarded load requested.", { unitId });
  } catch (error) {
    log("Failed to load rewarded ad.", error);
  }
};
const showRewarded = async () => {
  const unitId = ui.rewardedUnitId.value.trim();
  if (unitId.length === 0) {
    log("Provide a rewarded ad unit ID before showing.");
    return;
  }
  try {
    const ad = ensureRewardedInstance(unitId);
    await ad.show();
    log("Rewarded show requested.", { unitId });
  } catch (error) {
    log("Failed to show rewarded ad.", error);
  }
};
const getTrackingStatus = async () => {
  try {
    const status = await AdMob.trackingAuthorizationStatus();
    log("Tracking authorisation status.", status);
  } catch (error) {
    log("Failed to fetch tracking status.", error);
  }
};
const requestTracking = async () => {
  try {
    const status = await AdMob.requestTrackingAuthorization();
    log("Tracking authorisation request result.", status);
  } catch (error) {
    log("Failed to request tracking authorisation.", error);
  }
};
ui.start.addEventListener("click", () => {
  startAdMob().catch((error) => log("Unexpected start error", error));
});
ui.configure.addEventListener("click", () => {
  applyAppConfig().catch((error) => log("Unexpected configure error", error));
});
ui.requestConfig.addEventListener("click", () => {
  applyRequestConfig().catch((error) => log("Unexpected request config error", error));
});
ui.bannerLoad.addEventListener("click", () => {
  loadBanner().catch((error) => log("Unexpected banner load error", error));
});
ui.bannerShow.addEventListener("click", () => {
  showBanner().catch((error) => log("Unexpected banner show error", error));
});
ui.bannerHide.addEventListener("click", () => {
  hideBanner().catch((error) => log("Unexpected banner hide error", error));
});
ui.bannerHideTop.addEventListener("click", () => {
  hideBannerTop().catch((error) => log("Unexpected top banner hide error", error));
});
ui.bannerHideBottom.addEventListener("click", () => {
  hideBannerBottom().catch((error) => log("Unexpected bottom banner hide error", error));
});
ui.interstitialLoad.addEventListener("click", () => {
  loadInterstitial().catch((error) => log("Unexpected interstitial load error", error));
});
ui.interstitialShow.addEventListener("click", () => {
  showInterstitial().catch((error) => log("Unexpected interstitial show error", error));
});
ui.rewardedLoad.addEventListener("click", () => {
  loadRewarded().catch((error) => log("Unexpected rewarded load error", error));
});
ui.rewardedShow.addEventListener("click", () => {
  showRewarded().catch((error) => log("Unexpected rewarded show error", error));
});
ui.trackingStatus.addEventListener("click", () => {
  getTrackingStatus().catch((error) => log("Unexpected tracking status error", error));
});
ui.requestTracking.addEventListener("click", () => {
  requestTracking().catch((error) => log("Unexpected tracking request error", error));
});
ui.removeListeners.addEventListener("click", () => {
  removeEventListeners().catch((error) => log("Unexpected listener removal error", error));
});
ui.clearLog.addEventListener("click", () => {
  ui.log.textContent = "Logs cleared.";
});
registerEventListeners();
log("AdMob playground ready. Start the SDK before requesting ads.");
if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady().catch((error) => {
    console.error("Capgo notifyAppReady failed", error);
  });
}
export {
  AppUpdateAvailability as A,
  WebPlugin as W
};
