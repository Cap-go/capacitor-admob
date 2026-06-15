import { W as WebPlugin } from "./index-Bs_0vZCr.js";
class AdMobPlusWeb extends WebPlugin {
  addListener(eventName, listenerFunc) {
    return super.addListener(eventName, listenerFunc);
  }
  async start(...opts) {
    console.log("start", opts);
  }
  async configure(...opts) {
    console.log("configure", opts);
  }
  async configRequest(...opts) {
    console.log("configRequest", opts);
  }
  async adCreate(...opts) {
    console.log("adCreate", opts);
  }
  async adIsLoaded(...opts) {
    console.log("adIsLoaded", opts);
    return false;
  }
  async adLoad(...opts) {
    console.log("adLoad", opts);
  }
  async adShow(...opts) {
    console.log("adShow", opts);
  }
  async adHide(...opts) {
    console.log("adHide", opts);
  }
  async trackingAuthorizationStatus(...opts) {
    console.log("trackingAuthorizationStatus", opts);
    return { status: false };
  }
  async requestTrackingAuthorization(...opts) {
    console.log("requestTrackingAuthorization", opts);
    return { status: false };
  }
  async getPluginVersion() {
    return { version: "web" };
  }
}
export {
  AdMobPlusWeb
};
