# @capgo/capacitor-admob
 <a href="https://capgo.app/"><img src='https://raw.githubusercontent.com/Cap-go/capgo/main/assets/capgo_banner.png' alt='Capgo - Instant updates for capacitor'/></a>

<div align="center">
  <h2><a href="https://capgo.app/?ref=plugin"> ➡️ Get Instant updates for your App with Capgo</a></h2>
  <h2><a href="https://capgo.app/consulting/?ref=plugin"> Missing a feature? We’ll build the plugin for you 💪</a></h2>
</div>
AdMob SDK bridge for Capacitor apps

## Install

```bash
npm install @capgo/capacitor-admob
npx cap sync
```

## API

<docgen-index>

* [`start()`](#start)
* [`configure(...)`](#configure)
* [`configRequest(...)`](#configrequest)
* [`adCreate(...)`](#adcreate)
* [`adIsLoaded(...)`](#adisloaded)
* [`adLoad(...)`](#adload)
* [`adShow(...)`](#adshow)
* [`adHide(...)`](#adhide)
* [`trackingAuthorizationStatus()`](#trackingauthorizationstatus)
* [`requestTrackingAuthorization()`](#requesttrackingauthorization)
* [`addListener(string, ...)`](#addlistenerstring-)
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


### addListener(string, ...)

```typescript
addListener(eventName: string, listenerFunc: (event: any) => void) => Promise<PluginListenerHandle> & PluginListenerHandle
```

Add a listener for ad events.

| Param              | Type                                 | Description                                  |
| ------------------ | ------------------------------------ | -------------------------------------------- |
| **`eventName`**    | <code>string</code>                  | - The name of the event to listen for        |
| **`listenerFunc`** | <code>(event: any) =&gt; void</code> | - The function to call when the event occurs |

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


#### MobileAdOptions

Base options for mobile ads.

<code>{ /** The ad unit ID from AdMob */ adUnitId: string }</code>


### Enums


#### MaxAdContentRating

| Members           | Value             | Description        |
| ----------------- | ----------------- | ------------------ |
| **`G`**           | <code>'G'</code>  | General Audiences  |
| **`MA`**          | <code>'MA'</code> | Mature Audiences   |
| **`PG`**          | <code>'PG'</code> | Parental Guidance  |
| **`T`**           | <code>'T'</code>  | Teen               |
| **`UNSPECIFIED`** | <code>''</code>   | Unspecified rating |


#### TrackingAuthorizationStatus

| Members             | Value          | Description                                                |
| ------------------- | -------------- | ---------------------------------------------------------- |
| **`notDetermined`** | <code>0</code> | User has not yet received an authorization request         |
| **`restricted`**    | <code>1</code> | User restricted, device is unable to provide authorization |
| **`denied`**        | <code>2</code> | User denied authorization                                  |
| **`authorized`**    | <code>3</code> | User authorized access                                     |

</docgen-api>
