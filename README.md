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
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)
* [Enums](#enums)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### start()

```typescript
start() => Promise<void>
```

--------------------


### configure(...)

```typescript
configure(config: AdMobConfig) => Promise<void>
```

| Param        | Type                                                |
| ------------ | --------------------------------------------------- |
| **`config`** | <code><a href="#admobconfig">AdMobConfig</a></code> |

--------------------


### configRequest(...)

```typescript
configRequest(requestConfig: RequestConfig) => Promise<void>
```

| Param               | Type                                                    |
| ------------------- | ------------------------------------------------------- |
| **`requestConfig`** | <code><a href="#requestconfig">RequestConfig</a></code> |

--------------------


### adCreate(...)

```typescript
adCreate<O extends MobileAdOptions>(opts: O) => Promise<void>
```

| Param      | Type           |
| ---------- | -------------- |
| **`opts`** | <code>O</code> |

--------------------


### adIsLoaded(...)

```typescript
adIsLoaded(opts: { id: number; }) => Promise<boolean>
```

| Param      | Type                         |
| ---------- | ---------------------------- |
| **`opts`** | <code>{ id: number; }</code> |

**Returns:** <code>Promise&lt;boolean&gt;</code>

--------------------


### adLoad(...)

```typescript
adLoad(opts: { id: number; }) => Promise<void>
```

| Param      | Type                         |
| ---------- | ---------------------------- |
| **`opts`** | <code>{ id: number; }</code> |

--------------------


### adShow(...)

```typescript
adShow(opts: { id: number; }) => Promise<void>
```

| Param      | Type                         |
| ---------- | ---------------------------- |
| **`opts`** | <code>{ id: number; }</code> |

--------------------


### adHide(...)

```typescript
adHide(opts: { id: number; }) => Promise<void>
```

| Param      | Type                         |
| ---------- | ---------------------------- |
| **`opts`** | <code>{ id: number; }</code> |

--------------------


### trackingAuthorizationStatus()

```typescript
trackingAuthorizationStatus() => Promise<{ status: TrackingAuthorizationStatus | false; }>
```

**Returns:** <code>Promise&lt;{ status: false | <a href="#trackingauthorizationstatus">TrackingAuthorizationStatus</a>; }&gt;</code>

--------------------


### requestTrackingAuthorization()

```typescript
requestTrackingAuthorization() => Promise<{ status: TrackingAuthorizationStatus | false; }>
```

**Returns:** <code>Promise&lt;{ status: false | <a href="#trackingauthorizationstatus">TrackingAuthorizationStatus</a>; }&gt;</code>

--------------------


### addListener(string, ...)

```typescript
addListener(eventName: string, listenerFunc: (event: any) => void) => Promise<PluginListenerHandle> & PluginListenerHandle
```

| Param              | Type                                 |
| ------------------ | ------------------------------------ |
| **`eventName`**    | <code>string</code>                  |
| **`listenerFunc`** | <code>(event: any) =&gt; void</code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt; & <a href="#pluginlistenerhandle">PluginListenerHandle</a></code>

--------------------


### Interfaces


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |


### Type Aliases


#### AdMobConfig

<code>{ appMuted?: boolean; appVolume?: number; }</code>


#### RequestConfig

<code>{ maxAdContentRating?: <a href="#maxadcontentrating">MaxAdContentRating</a>; sameAppKey?: boolean; tagForChildDirectedTreatment?: boolean | null; tagForUnderAgeOfConsent?: boolean | null; testDeviceIds?: string[]; }</code>


#### MobileAdOptions

<code>{ adUnitId: string }</code>


### Enums


#### MaxAdContentRating

| Members           | Value             |
| ----------------- | ----------------- |
| **`G`**           | <code>'G'</code>  |
| **`MA`**          | <code>'MA'</code> |
| **`PG`**          | <code>'PG'</code> |
| **`T`**           | <code>'T'</code>  |
| **`UNSPECIFIED`** | <code>''</code>   |


#### TrackingAuthorizationStatus

| Members             | Value          |
| ------------------- | -------------- |
| **`notDetermined`** | <code>0</code> |
| **`restricted`**    | <code>1</code> |
| **`denied`**        | <code>2</code> |
| **`authorized`**    | <code>3</code> |

</docgen-api>
