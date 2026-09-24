# @capgo/capacitor-admob
<a href="https://capgo.app/"><img src="https://capgo.app/readme-banner.svg?repo=Cap-go/capacitor-admob" alt="Capgo - Instant updates for Capacitor" /></a>

<div align="center">
  <h2><a href="https://capgo.app/?ref=plugin_admob"> ➡️ Get Instant updates for your App with Capgo</a></h2>
  <h2><a href="https://capgo.app/consulting/?ref=plugin_admob"> Missing a feature? We’ll build the plugin for you 💪</a></h2>
</div>
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
* [`trackingAuthorizationStatus()`](#trackingauthorizationstatus)
* [`requestTrackingAuthorization()`](#requesttrackingauthorization)
* [`addListener(AdMobPlusEventName, ...)`](#addlisteneradmobpluseventname-)
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


### addListener(AdMobPlusEventName, ...)

```typescript
addListener(eventName: AdMobPlusEventName, listenerFunc: (event: any) => void) => Promise<PluginListenerHandle> & PluginListenerHandle
```

Add a listener for ad events.

| Param              | Type                                                              | Description                                  |
| ------------------ | ----------------------------------------------------------------- | -------------------------------------------- |
| **`eventName`**    | <code><a href="#admobpluseventname">AdMobPlusEventName</a></code> | - The name of the event to listen for        |
| **`listenerFunc`** | <code>(event: any) =&gt; void</code>                              | - The function to call when the event occurs |

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


#### AdMobPlusEventName

<code>(typeof AdMobPlusEvents)[keyof typeof AdMobPlusEvents]</code>


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
