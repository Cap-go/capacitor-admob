# @capgo/capacitor-admob

Show Google AdMob ads in your Capacitor app on iOS and Android: banner, interstitial, rewarded and rewarded interstitial formats from one TypeScript API. Monetize your app with the official Google Mobile Ads SDKs underneath.

<a href="https://capgo.app/?ref=plugin_admob"><img src="https://capgo.app/readme-banner.svg?repo=Cap-go/capacitor-admob" alt="Capgo - Instant updates for Capacitor" /></a>

<div align="center">
  <p><b>Capgo</b>: open-source live updates for Ionic and Capacitor apps. Ship OTA fixes and features instantly, without waiting for app store review.</p>
  <h2><a href="https://capgo.app/register/?ref=plugin_admob">➡️ Get started for free</a></h2>
  <p>14-day unlimited free trial. No credit card required</p>
  <p><a href="https://capgo.app/consulting/?ref=plugin_admob">Missing a feature? We'll build the plugin for you 💪</a></p>
</div>

<p align="center">
  <img src="https://raw.githubusercontent.com/Cap-go/capacitor-admob/main/assets/github-social-preview.png" alt="@capgo/capacitor-admob for Capacitor apps" width="300" />
</p>

## Key features

- **Four ad formats**: `BannerAd`, `InterstitialAd`, `RewardedAd` and `RewardedInterstitialAd` classes with load and show, plus `hide()` on `BannerAd`.
- **Ad lifecycle**: `adCreate()`, `adLoad()`, `adIsLoaded()`, `adShow()` and `adHide()` give you full control over each ad instance.
- **SDK setup**: `start()` initializes AdMob, `configure()` sets app-wide options and `configRequest()` sets request options.
- **App Tracking Transparency**: `trackingAuthorizationStatus()` and `requestTrackingAuthorization()` handle the iOS tracking prompt.
- **Current SDKs**: Google Mobile Ads Next Gen SDK on Android and Google Mobile Ads SDK on iOS.
- **Platforms**: iOS and Android. The web implementation is a no-op stub.

AdMob SDK bridge for Capacitor apps

Android now uses the Google Mobile Ads Next Gen SDK, and iOS is aligned to Google Mobile Ads SDK `13.1.x`, while preserving the existing Capacitor-facing API.

## Documentation

The most complete doc is available here: https://capgo.app/docs/plugins/admob/

## Compatibility

| Plugin version | Capacitor compatibility | Maintained |
| -------------- | ----------------------- | ---------- |
| v8.\*.\*       | v8.\*.\*                | ✅          |
| v7.\*.\*       | v7.\*.\*                | On demand   |
| v6.\*.\*       | v6.\*.\*                | ❌          |
| v5.\*.\*       | v5.\*.\*                | ❌          |

> **Note:** The major version of this plugin follows the major version of Capacitor. Use the version that matches your Capacitor installation (e.g., plugin v8 for Capacitor 8). Only the latest major version is actively maintained.

## Install

You can use our AI-Assisted Setup to install the plugin. Add the Capgo skills to your AI tool using the following command:

```bash
npx skills add https://github.com/cap-go/capacitor-skills --skill capacitor-plugins
```

Then use the following prompt:

```text
Use the `capacitor-plugins` skill from `cap-go/capacitor-skills` to install the `@capgo/capacitor-admob` plugin in my project.
```

If you prefer Manual Setup, install the plugin by running the following commands and follow the platform-specific instructions below:

```bash
npm install @capgo/capacitor-admob
npx cap sync
```

## Consent (UMP)

For apps serving users in the EEA/UK, request consent with Google's User Messaging Platform (UMP) before loading ads. Configure GDPR messages in your AdMob account first.

```typescript
import { AdMob, AdmobConsentStatus } from '@capgo/capacitor-admob';

await AdMob.start();

let consentInfo = await AdMob.requestConsentInfo();
if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
  consentInfo = await AdMob.showConsentForm();
}

if (consentInfo.canRequestAds) {
  // Load ads only after consent allows ad requests.
}
```

To let users manage privacy choices later, call `showPrivacyOptionsForm()` from a settings screen when `privacyOptionsRequirementStatus` is `REQUIRED`.

For local testing on a real device, pass `debugGeography` and `testDeviceIdentifiers` to `requestConsentInfo()`.

## API

<docgen-index>

* [`start()`](#start)
* [`configure(...)`](#configure)
* [`configRequest(...)`](#configrequest)
* [`requestConsentInfo(...)`](#requestconsentinfo)
* [`showConsentForm()`](#showconsentform)
* [`showPrivacyOptionsForm()`](#showprivacyoptionsform)
* [`adCreate(...)`](#adcreate)
* [`adIsLoaded(...)`](#adisloaded)
* [`adLoad(...)`](#adload)
* [`adShow(...)`](#adshow)
* [`adHide(...)`](#adhide)
* [`feedAdCreate(...)`](#feedadcreate)
* [`feedAdDestroy(...)`](#feedaddestroy)
* [`feedAdLoad(...)`](#feedadload)
* [`feedAdIsLoaded(...)`](#feedadisloaded)
* [`feedAdUpdateBounds(...)`](#feedadupdatebounds)
* [`feedAdSetAutoRefresh(...)`](#feedadsetautorefresh)
* [`trackingAuthorizationStatus()`](#trackingauthorizationstatus)
* [`requestTrackingAuthorization()`](#requesttrackingauthorization)
* [`addListener(E, ...)`](#addlistenere-)
* [`getPluginVersion()`](#getpluginversion)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)
* [Enums](#enums)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

AdMob Plus Plugin interface for displaying Google AdMob ads in Capacitor apps.

### start()

```typescript
start() => Promise<void>
```

Initialize and start the AdMob SDK.

**Since:** 1.0.0

--------------------


### configure(...)

```typescript
configure(config: AdMobConfig) => Promise<void>
```

Configure AdMob settings.

| Param        | Type                                                | Description                       |
| ------------ | --------------------------------------------------- | --------------------------------- |
| **`config`** | <code><a href="#admobconfig">AdMobConfig</a></code> | - Configuration options for AdMob |

**Since:** 1.0.0

--------------------


### configRequest(...)

```typescript
configRequest(requestConfig: RequestConfig) => Promise<void>
```

Configure ad request settings.

| Param               | Type                                                    | Description                     |
| ------------------- | ------------------------------------------------------- | ------------------------------- |
| **`requestConfig`** | <code><a href="#requestconfig">RequestConfig</a></code> | - Request configuration options |

**Since:** 1.0.0

--------------------


### requestConsentInfo(...)

```typescript
requestConsentInfo(options?: AdmobConsentRequestOptions | undefined) => Promise<AdmobConsentInfo>
```

Request user consent information from Google's User Messaging Platform (UMP).

Call this after `start()` and before loading ads for users in the EEA/UK.

| Param         | Type                                                                              | Description                                                  |
| ------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **`options`** | <code><a href="#admobconsentrequestoptions">AdmobConsentRequestOptions</a></code> | - Optional consent request options for debugging and tagging |

**Returns:** <code>Promise&lt;<a href="#admobconsentinfo">AdmobConsentInfo</a>&gt;</code>

**Since:** 8.2.0

--------------------


### showConsentForm()

```typescript
showConsentForm() => Promise<AdmobConsentInfo>
```

Shows the Google user consent form rendered from your GDPR message configuration.

**Returns:** <code>Promise&lt;<a href="#admobconsentinfo">AdmobConsentInfo</a>&gt;</code>

**Since:** 8.2.0

--------------------


### showPrivacyOptionsForm()

```typescript
showPrivacyOptionsForm() => Promise<void>
```

Shows the Google privacy options form rendered from your GDPR message configuration.

Use this when your privacy message requires an in-app entry point for users to manage choices.

**Since:** 8.2.0

--------------------


### adCreate(...)

```typescript
adCreate<O extends MobileAdOptions>(opts: O) => Promise<void>
```

Create a new ad instance.

| Param      | Type           | Description                                         |
| ---------- | -------------- | --------------------------------------------------- |
| **`opts`** | <code>O</code> | - Options for creating the ad, including ad unit ID |

**Since:** 1.0.0

--------------------


### adIsLoaded(...)

```typescript
adIsLoaded(opts: { id: number; }) => Promise<boolean>
```

Check if an ad is loaded and ready to be shown.

| Param      | Type                         | Description                   |
| ---------- | ---------------------------- | ----------------------------- |
| **`opts`** | <code>{ id: number; }</code> | - Object containing the ad ID |

**Returns:** <code>Promise&lt;boolean&gt;</code>

**Since:** 1.0.0

--------------------


### adLoad(...)

```typescript
adLoad(opts: { id: number; }) => Promise<void>
```

Load an ad.

| Param      | Type                         | Description                   |
| ---------- | ---------------------------- | ----------------------------- |
| **`opts`** | <code>{ id: number; }</code> | - Object containing the ad ID |

**Since:** 1.0.0

--------------------


### adShow(...)

```typescript
adShow(opts: { id: number; }) => Promise<void>
```

Show a loaded ad.

| Param      | Type                         | Description                   |
| ---------- | ---------------------------- | ----------------------------- |
| **`opts`** | <code>{ id: number; }</code> | - Object containing the ad ID |

**Since:** 1.0.0

--------------------


### adHide(...)

```typescript
adHide(opts: { id: number; }) => Promise<void>
```

Hide a currently displayed ad.

| Param      | Type                         | Description                   |
| ---------- | ---------------------------- | ----------------------------- |
| **`opts`** | <code>{ id: number; }</code> | - Object containing the ad ID |

**Since:** 1.0.0

--------------------


### feedAdCreate(...)

```typescript
feedAdCreate(opts: FeedAdCreateOptions) => Promise<{ id: number; }>
```

Create an in-feed ad slot (native overlay or inline banner overlay).

| Param      | Type                                                                | Description             |
| ---------- | ------------------------------------------------------------------- | ----------------------- |
| **`opts`** | <code><a href="#feedadcreateoptions">FeedAdCreateOptions</a></code> | - Feed ad configuration |

**Returns:** <code>Promise&lt;{ id: number; }&gt;</code>

**Since:** 8.3.0

--------------------


### feedAdDestroy(...)

```typescript
feedAdDestroy(opts: { id: number; }) => Promise<void>
```

Destroy a feed ad instance and remove its native overlay.

| Param      | Type                         | Description                        |
| ---------- | ---------------------------- | ---------------------------------- |
| **`opts`** | <code>{ id: number; }</code> | - Object containing the feed ad id |

**Since:** 8.3.0

--------------------


### feedAdLoad(...)

```typescript
feedAdLoad(opts: { id: number; }) => Promise<void>
```

Load or reload the feed ad. Listen for `feed.load` / `feed.loadfail` events.

| Param      | Type                         | Description                        |
| ---------- | ---------------------------- | ---------------------------------- |
| **`opts`** | <code>{ id: number; }</code> | - Object containing the feed ad id |

**Since:** 8.3.0

--------------------


### feedAdIsLoaded(...)

```typescript
feedAdIsLoaded(opts: { id: number; }) => Promise<boolean>
```

Whether the feed ad has finished loading.

| Param      | Type                         | Description                        |
| ---------- | ---------------------------- | ---------------------------------- |
| **`opts`** | <code>{ id: number; }</code> | - Object containing the feed ad id |

**Returns:** <code>Promise&lt;boolean&gt;</code>

**Since:** 8.3.0

--------------------


### feedAdUpdateBounds(...)

```typescript
feedAdUpdateBounds(opts: FeedAdBounds & { id: number; }) => Promise<void>
```

Position the native overlay over an HTML placeholder. Call on scroll, resize, and orientation changes.

| Param      | Type                                                                    | Description                                                    |
| ---------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| **`opts`** | <code><a href="#feedadbounds">FeedAdBounds</a> & { id: number; }</code> | - Feed ad id and bounds from `element.getBoundingClientRect()` |

**Since:** 8.3.0

--------------------


### feedAdSetAutoRefresh(...)

```typescript
feedAdSetAutoRefresh(opts: { id: number; autoRefreshMs: number | null; }) => Promise<void>
```

Enable or disable auto-refresh (minimum 30 seconds).

| Param      | Type                                                        | Description                                           |
| ---------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| **`opts`** | <code>{ id: number; autoRefreshMs: number \| null; }</code> | - Feed ad id and interval in ms, or `null` to disable |

**Since:** 8.3.0

--------------------


### trackingAuthorizationStatus()

```typescript
trackingAuthorizationStatus() => Promise<{ status: TrackingAuthorizationStatus | false; }>
```

Get the current tracking authorization status (iOS only).

**Returns:** <code>Promise&lt;{ status: false | <a href="#trackingauthorizationstatus">TrackingAuthorizationStatus</a>; }&gt;</code>

**Since:** 1.0.0

--------------------


### requestTrackingAuthorization()

```typescript
requestTrackingAuthorization() => Promise<{ status: TrackingAuthorizationStatus | false; }>
```

Request tracking authorization from the user (iOS only).

**Returns:** <code>Promise&lt;{ status: false | <a href="#trackingauthorizationstatus">TrackingAuthorizationStatus</a>; }&gt;</code>

**Since:** 1.0.0

--------------------


### addListener(E, ...)

```typescript
addListener<E extends AdMobPlusEventName>(eventName: E, listenerFunc: (event: AdMobPlusEventPayloadMap[E]) => void) => Promise<PluginListenerHandle> & PluginListenerHandle
```

Add a listener for ad events.

| Param              | Type                                                         | Description                                  |
| ------------------ | ------------------------------------------------------------ | -------------------------------------------- |
| **`eventName`**    | <code>E</code>                                               | - The name of the event to listen for        |
| **`listenerFunc`** | <code>(event: AdMobPlusEventPayloadMap[E]) =&gt; void</code> | - The function to call when the event occurs |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt; & <a href="#pluginlistenerhandle">PluginListenerHandle</a></code>

**Since:** 1.0.0

--------------------


### getPluginVersion()

```typescript
getPluginVersion() => Promise<{ version: string; }>
```

Get the native Capacitor plugin version.

**Returns:** <code>Promise&lt;{ version: string; }&gt;</code>

**Since:** 1.0.0

--------------------


### Interfaces


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |


### Type Aliases


#### AdMobConfig

Configuration options for AdMob.

<code>{ /** Whether the app should be muted */ appMuted?: boolean; /** The app volume (0.0 to 1.0) */ appVolume?: number; }</code>


#### RequestConfig

Configuration for ad requests.

<code>{ /** Maximum ad content rating */ maxAdContentRating?: <a href="#maxadcontentrating">MaxAdContentRating</a>; /** Whether to use the same app key */ sameAppKey?: boolean; /** Tag for child-directed treatment (true, false, or null for unspecified) */ tagForChildDirectedTreatment?: boolean | null; /** Tag for under age of consent (true, false, or null for unspecified) */ tagForUnderAgeOfConsent?: boolean | null; /** Array of test device IDs */ testDeviceIds?: string[]; }</code>


#### AdmobConsentInfo

Consent information returned by UMP.

<code>{ /** The consent status of the user. */ status: <a href="#admobconsentstatus">AdmobConsentStatus</a>; /** If true, a consent form is available. */ isConsentFormAvailable?: boolean; /** If true, an ad request can be made. */ canRequestAds: boolean; /** Privacy options requirement status of the user. */ privacyOptionsRequirementStatus: <a href="#privacyoptionsrequirementstatus">PrivacyOptionsRequirementStatus</a>; }</code>


#### AdmobConsentRequestOptions

Options for requesting UMP consent information.

<code>{ /** Sets the debug geography to test consent locally. */ debugGeography?: <a href="#admobconsentdebuggeography">AdmobConsentDebugGeography</a>; /** * Test device IDs to allow for consent debugging. * On iOS, the ID may change if you uninstall and reinstall the app. */ testDeviceIdentifiers?: string[]; /** * When true, tags the user as under the age of consent for UMP requests. * * @default false */ tagForUnderAgeOfConsent?: boolean; }</code>


#### MobileAdOptions

Base options for mobile ads.

<code>{ /** The ad unit ID from AdMob */ adUnitId: string; }</code>


#### FeedAdCreateOptions

Options for creating an in-feed ad instance.

Policy: AdMob counts native impressions and clicks only when assets render inside
{@link https://developers.google.com/admob/android/native/advanced | NativeAdView} /
GADNativeAdView with the AdChoices icon and an ad attribution badge. This plugin
overlays a compliant native view on your placeholder. Optional {@link FeedNativeAdAssets}
are returned on `feed.load` for layout sizing only, not for manual click forwarding.

<code>{ /** Native advanced or inline banner. */ format: <a href="#feedadformat">FeedAdFormat</a>; /** AdMob ad unit ID. */ adUnitId: string; /** Optional key echoed on feed events for your feed slot. */ positionKey?: string; /** * Auto-refresh interval in milliseconds. AdMob requires at least 30 seconds. * Omit or pass `null` to disable auto-refresh. */ autoRefreshMs?: number | null; /** Template colors when `format` is `native`. */ nativeStyle?: <a href="#feednativeadstyle">FeedNativeAdStyle</a>; }</code>


#### FeedAdFormat

In-feed ad format. Both use a native overlay aligned to an HTML placeholder.

<code>'native' | 'banner'</code>


#### FeedNativeAdStyle

Optional colors for the built-in native ad template (hex strings, e.g. `#ffffff`).

<code>{ backgroundColor?: string; headlineTextColor?: string; bodyTextColor?: string; ctaBackgroundColor?: string; ctaTextColor?: string; }</code>


#### FeedAdBounds

Bounds of the HTML placeholder, in CSS pixels relative to the WebView viewport.

<code>{ x: number; y: number; width: number; height: number; /** When false, the native overlay is hidden (e.g. off-screen while scrolling). */ visible: boolean; /** `window.devicePixelRatio` from the WebView. Defaults to 1 on web. */ density?: number; }</code>


#### AdMobPlusEventName

<code>(typeof AdMobPlusEvents)[keyof typeof AdMobPlusEvents]</code>


#### AdMobPlusEventPayloadMap

Maps each {@link <a href="#admobpluseventname">AdMobPlusEventName</a>} to the payload shape emitted from native code.

<code>{ [AdMobPlusEvents.AdClick]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.AdDismiss]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.AdImpression]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.AdLoad]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.AdLoadFail]: <a href="#admobplusadfailurepayload">AdMobPlusAdFailurePayload</a>; [AdMobPlusEvents.AdReward]: <a href="#admobplusadrewardpayload">AdMobPlusAdRewardPayload</a>; [AdMobPlusEvents.AdShow]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.AdShowFail]: <a href="#admobplusadfailurepayload">AdMobPlusAdFailurePayload</a>; [AdMobPlusEvents.BannerClick]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.BannerClose]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.BannerImpression]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.BannerLoad]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.BannerLoadFail]: <a href="#admobplusadfailurepayload">AdMobPlusAdFailurePayload</a>; [AdMobPlusEvents.BannerOpen]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.BannerSizeChange]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.InterstitialDismiss]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.InterstitialImpression]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.InterstitialLoad]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.InterstitialLoadFail]: <a href="#admobplusadfailurepayload">AdMobPlusAdFailurePayload</a>; [AdMobPlusEvents.InterstitialShow]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.InterstitialShowFail]: <a href="#admobplusadfailurepayload">AdMobPlusAdFailurePayload</a>; [AdMobPlusEvents.RewardedDismiss]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.RewardedImpression]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.RewardedInterstitialDismiss]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.RewardedInterstitialImpression]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.RewardedInterstitialLoad]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.RewardedInterstitialLoadFail]: <a href="#admobplusadfailurepayload">AdMobPlusAdFailurePayload</a>; [AdMobPlusEvents.RewardedInterstitialReward]: <a href="#admobplusadrewardpayload">AdMobPlusAdRewardPayload</a>; [AdMobPlusEvents.RewardedInterstitialShow]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.RewardedInterstitialShowFail]: <a href="#admobplusadfailurepayload">AdMobPlusAdFailurePayload</a>; [AdMobPlusEvents.RewardedLoad]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.RewardedLoadFail]: <a href="#admobplusadfailurepayload">AdMobPlusAdFailurePayload</a>; [AdMobPlusEvents.RewardedReward]: <a href="#admobplusadrewardpayload">AdMobPlusAdRewardPayload</a>; [AdMobPlusEvents.RewardedShow]: <a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a>; [AdMobPlusEvents.RewardedShowFail]: <a href="#admobplusadfailurepayload">AdMobPlusAdFailurePayload</a>; [AdMobPlusEvents.FeedClick]: <a href="#admobplusfeedadidpayload">AdMobPlusFeedAdIdPayload</a>; [AdMobPlusEvents.FeedClose]: <a href="#admobplusfeedadidpayload">AdMobPlusFeedAdIdPayload</a>; [AdMobPlusEvents.FeedImpression]: <a href="#admobplusfeedadidpayload">AdMobPlusFeedAdIdPayload</a>; [AdMobPlusEvents.FeedLoad]: <a href="#admobplusfeedloadpayload">AdMobPlusFeedLoadPayload</a>; [AdMobPlusEvents.FeedLoadFail]: <a href="#admobplusadfailurepayload">AdMobPlusAdFailurePayload</a> & <a href="#admobplusfeedadidpayload">AdMobPlusFeedAdIdPayload</a>; [AdMobPlusEvents.FeedOpen]: <a href="#admobplusfeedadidpayload">AdMobPlusFeedAdIdPayload</a>; [AdMobPlusEvents.FeedRefresh]: <a href="#admobplusfeedadidpayload">AdMobPlusFeedAdIdPayload</a>; }</code>


#### AdMobPlusAdIdPayload

Event payload always includes the native ad instance id (`adId`). iOS also emits legacy `id`.

<code>{ adId: number; id?: number; }</code>


#### AdMobPlusAdFailurePayload

Load and fullscreen show failure payloads from native `LoadAdError` / `FullScreenContentError`.

<code><a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a> & { code: number; message: string; /** Legacy iOS failure field; same string as `message` when present. */ error?: string; }</code>


#### AdMobPlusAdRewardPayload

Reward callbacks include the earned reward plus `adId`.

<code><a href="#admobplusadidpayload">AdMobPlusAdIdPayload</a> & { reward: { amount: number; type: string; }; }</code>


#### AdMobPlusFeedAdIdPayload

In-feed ad events use `feedAdId` (same numeric id as `feedAdCreate`).

<code>{ feedAdId: number; positionKey?: string; format?: 'native' | 'banner'; }</code>


#### AdMobPlusFeedLoadPayload

<code><a href="#admobplusfeedadidpayload">AdMobPlusFeedAdIdPayload</a> & { assets?: <a href="#record">Record</a>&lt;string, unknown&gt;; }</code>


#### Record

Construct a type with a set of properties K of type T

<code>{ [P in K]: T; }</code>


### Enums


#### MaxAdContentRating

| Members           | Value             | Description        |
| ----------------- | ----------------- | ------------------ |
| **`G`**           | <code>'G'</code>  | General Audiences  |
| **`MA`**          | <code>'MA'</code> | Mature Audiences   |
| **`PG`**          | <code>'PG'</code> | Parental Guidance  |
| **`T`**           | <code>'T'</code>  | Teen               |
| **`UNSPECIFIED`** | <code>''</code>   | Unspecified rating |


#### AdmobConsentStatus

| Members            | Value                       | Description                                                     |
| ------------------ | --------------------------- | --------------------------------------------------------------- |
| **`NOT_REQUIRED`** | <code>'NOT_REQUIRED'</code> | User consent not required.                                      |
| **`OBTAINED`**     | <code>'OBTAINED'</code>     | User consent already obtained.                                  |
| **`REQUIRED`**     | <code>'REQUIRED'</code>     | User consent required but not yet obtained.                     |
| **`UNKNOWN`**      | <code>'UNKNOWN'</code>      | Unknown consent status. Call requestConsentInfo() to update it. |


#### PrivacyOptionsRequirementStatus

| Members            | Value                       | Description                                    |
| ------------------ | --------------------------- | ---------------------------------------------- |
| **`NOT_REQUIRED`** | <code>'NOT_REQUIRED'</code> | Privacy options entry point is not required.   |
| **`REQUIRED`**     | <code>'REQUIRED'</code>     | Privacy options entry point is required.       |
| **`UNKNOWN`**      | <code>'UNKNOWN'</code>      | Privacy options requirement status is unknown. |


#### AdmobConsentDebugGeography

| Members        | Value          | Description                                                     |
| -------------- | -------------- | --------------------------------------------------------------- |
| **`DISABLED`** | <code>0</code> | Debug geography disabled.                                       |
| **`EEA`**      | <code>1</code> | Geography appears as in EEA for debug devices.                  |
| **`NOT_EEA`**  | <code>2</code> | Geography appears as not in EEA for debug devices.              |
| **`US`**       | <code>3</code> | Geography appears as in a regulated US state for debug devices. |
| **`OTHER`**    | <code>4</code> | Geography appears as OTHER for debug devices.                   |


#### TrackingAuthorizationStatus

| Members             | Value          | Description                                                |
| ------------------- | -------------- | ---------------------------------------------------------- |
| **`notDetermined`** | <code>0</code> | User has not yet received an authorization request         |
| **`restricted`**    | <code>1</code> | User restricted, device is unable to provide authorization |
| **`denied`**        | <code>2</code> | User denied authorization                                  |
| **`authorized`**    | <code>3</code> | User authorized access                                     |

</docgen-api>
