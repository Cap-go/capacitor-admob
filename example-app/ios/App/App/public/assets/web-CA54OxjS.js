import { W as WebPlugin, A as AppUpdateAvailability } from "./index-Bs_0vZCr.js";
const BUNDLE_BUILTIN = {
  status: "success",
  version: "",
  downloaded: "1970-01-01T00:00:00.000Z",
  id: "builtin",
  checksum: ""
};
class CapacitorUpdaterWeb extends WebPlugin {
  async setStatsUrl(options) {
    console.warn("Cannot setStatsUrl in web", options);
    return;
  }
  async setUpdateUrl(options) {
    console.warn("Cannot setUpdateUrl in web", options);
    return;
  }
  async setChannelUrl(options) {
    console.warn("Cannot setChannelUrl in web", options);
    return;
  }
  async download(options) {
    console.warn("Cannot download version in web", options);
    return BUNDLE_BUILTIN;
  }
  async next(options) {
    console.warn("Cannot set next version in web", options);
    return BUNDLE_BUILTIN;
  }
  async isAutoUpdateEnabled() {
    console.warn("Cannot get isAutoUpdateEnabled in web");
    return { enabled: false };
  }
  async set(options) {
    console.warn("Cannot set active bundle in web", options);
    return;
  }
  async startPreviewSession(options) {
    console.warn("Cannot start preview session in web", options);
    return;
  }
  async getDeviceId() {
    console.warn("Cannot get ID in web");
    return { deviceId: "default" };
  }
  async getBuiltinVersion() {
    console.warn("Cannot get version in web");
    return { version: "default" };
  }
  async getPluginVersion() {
    console.warn("Cannot get plugin version in web");
    return { version: "default" };
  }
  async delete(options) {
    console.warn("Cannot delete bundle in web", options);
  }
  async setBundleError(options) {
    console.warn("Cannot setBundleError in web", options);
    return BUNDLE_BUILTIN;
  }
  async list() {
    console.warn("Cannot list bundles in web");
    return { bundles: [] };
  }
  async reset(options) {
    console.warn("Cannot reset version in web", options);
  }
  async current() {
    console.warn("Cannot get current bundle in web");
    return { bundle: BUNDLE_BUILTIN, native: "0.0.0" };
  }
  async reload() {
    console.warn("Cannot reload current bundle in web");
    return;
  }
  async getLatest() {
    console.warn("Cannot getLatest current bundle in web");
    return {
      version: "0.0.0",
      message: "Cannot getLatest current bundle in web"
    };
  }
  async triggerUpdateCheck() {
    console.warn("Cannot triggerUpdateCheck in web");
    return { status: "unavailable", queued: false };
  }
  async getMissingBundleFiles(options) {
    var _a, _b, _c;
    console.warn("Cannot inspect missing bundle files in web", { manifestLength: (_b = (_a = options.manifest) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 });
    const missing = (_c = options.manifest) !== null && _c !== void 0 ? _c : [];
    return {
      missing,
      total: missing.length,
      missingCount: missing.length,
      reusableCount: 0
    };
  }
  async getBundleDownloadSize(options) {
    var _a, _b, _c, _d, _e;
    console.warn("Cannot estimate bundle download size in web", { manifestLength: (_b = (_a = options.manifest) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 });
    return {
      totalSize: 0,
      knownFiles: 0,
      unknownFiles: (_d = (_c = options.manifest) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0,
      files: ((_e = options.manifest) !== null && _e !== void 0 ? _e : []).map((entry) => ({
        file_name: entry.file_name,
        file_hash: entry.file_hash,
        download_url: entry.download_url,
        error: "unavailable"
      }))
    };
  }
  async setChannel(options) {
    console.warn("Cannot setChannel in web", options);
    return {
      status: "error",
      error: "Cannot setChannel in web"
    };
  }
  async unsetChannel(options) {
    console.warn("Cannot unsetChannel in web", options);
    return;
  }
  async setCustomId(options) {
    console.warn("Cannot setCustomId in web", options);
    return;
  }
  async getChannel() {
    console.warn("Cannot getChannel in web");
    return {
      status: "error",
      error: "Cannot getChannel in web"
    };
  }
  async listChannels() {
    console.warn("Cannot listChannels in web");
    throw {
      message: "Cannot listChannels in web",
      error: "platform_not_supported"
    };
  }
  async notifyAppReady() {
    return { bundle: BUNDLE_BUILTIN };
  }
  async setMultiDelay(options) {
    console.warn("Cannot setMultiDelay in web", options === null || options === void 0 ? void 0 : options.delayConditions);
    return;
  }
  async cancelDelay() {
    console.warn("Cannot cancelDelay in web");
    return;
  }
  async isAutoUpdateAvailable() {
    console.warn("Cannot isAutoUpdateAvailable in web");
    return { available: false };
  }
  async getCurrentBundle() {
    console.warn("Cannot get current bundle in web");
    return BUNDLE_BUILTIN;
  }
  async getNextBundle() {
    return Promise.resolve(null);
  }
  async getFailedUpdate() {
    console.warn("Cannot getFailedUpdate in web");
    return null;
  }
  async setShakeMenu(_options) {
    throw this.unimplemented("Shake menu not available on web platform");
  }
  async isShakeMenuEnabled() {
    return Promise.resolve({ enabled: false });
  }
  async setShakeChannelSelector(_options) {
    throw this.unimplemented("Shake channel selector not available on web platform");
  }
  async isShakeChannelSelectorEnabled() {
    return Promise.resolve({ enabled: false });
  }
  async getAppId() {
    console.warn("Cannot getAppId in web");
    return { appId: "default" };
  }
  async setAppId(options) {
    console.warn("Cannot setAppId in web", options);
    return;
  }
  // ============================================================================
  // App Store / Play Store Update Methods (Web stubs)
  // ============================================================================
  async getAppUpdateInfo(_options) {
    console.warn("getAppUpdateInfo is not available on web platform");
    return {
      currentVersionName: "0.0.0",
      currentVersionCode: "0",
      updateAvailability: AppUpdateAvailability.UNKNOWN
    };
  }
  async openAppStore(_options) {
    throw this.unimplemented("openAppStore is not available on web platform");
  }
  async performImmediateUpdate() {
    throw this.unimplemented("performImmediateUpdate is only available on Android");
  }
  async startFlexibleUpdate() {
    throw this.unimplemented("startFlexibleUpdate is only available on Android");
  }
  async completeFlexibleUpdate() {
    throw this.unimplemented("completeFlexibleUpdate is only available on Android");
  }
}
export {
  CapacitorUpdaterWeb
};
