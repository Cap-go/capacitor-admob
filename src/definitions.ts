import type { PluginListenerHandle } from '@capacitor/core';

import type { AdMobPlusEventName } from './events';

/**
 * Maximum ad content rating enum used to restrict ads based on content rating.
 *
 * @since 1.0.0
 */
export enum MaxAdContentRating {
  /** General Audiences */
  G = 'G',
  /** Mature Audiences */
  MA = 'MA',
  /** Parental Guidance */
  PG = 'PG',
  /** Teen */
  T = 'T',
  /** Unspecified rating */
  UNSPECIFIED = '',
}

/**
 * Configuration options for AdMob.
 *
 * @since 1.0.0
 */
export type AdMobConfig = {
  /** Whether the app should be muted */
  appMuted?: boolean;
  /** The app volume (0.0 to 1.0) */
  appVolume?: number;
};

/**
 * Configuration for ad requests.
 *
 * @since 1.0.0
 */
export type RequestConfig = {
  /** Maximum ad content rating */
  maxAdContentRating?: MaxAdContentRating;
  /** Whether to use the same app key */
  sameAppKey?: boolean;
  /** Tag for child-directed treatment (true, false, or null for unspecified) */
  tagForChildDirectedTreatment?: boolean | null;
  /** Tag for under age of consent (true, false, or null for unspecified) */
  tagForUnderAgeOfConsent?: boolean | null;
  /** Array of test device IDs */
  testDeviceIds?: string[];
};

/**
 * Consent status from Google's User Messaging Platform (UMP).
 *
 * @see https://developers.google.com/admob/ump/android/reference/com/google/android/ump/ConsentInformation.ConsentStatus
 * @since 8.2.0
 */
export enum AdmobConsentStatus {
  /** User consent not required. */
  NOT_REQUIRED = 'NOT_REQUIRED',
  /** User consent already obtained. */
  OBTAINED = 'OBTAINED',
  /** User consent required but not yet obtained. */
  REQUIRED = 'REQUIRED',
  /** Unknown consent status. Call requestConsentInfo() to update it. */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Privacy options requirement status from UMP.
 *
 * @see https://developers.google.com/admob/ump/android/reference/com/google/android/ump/ConsentInformation.PrivacyOptionsRequirementStatus
 * @since 8.2.0
 */
export enum PrivacyOptionsRequirementStatus {
  /** Privacy options entry point is not required. */
  NOT_REQUIRED = 'NOT_REQUIRED',
  /** Privacy options entry point is required. */
  REQUIRED = 'REQUIRED',
  /** Privacy options requirement status is unknown. */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Debug geography for testing UMP consent flows locally.
 *
 * @see https://developers.google.com/admob/ump/android/reference/com/google/android/ump/ConsentDebugSettings.DebugGeography
 * @since 8.2.0
 */
export enum AdmobConsentDebugGeography {
  /** Debug geography disabled. */
  DISABLED = 0,
  /** Geography appears as in EEA for debug devices. */
  EEA = 1,
  /**
   * Geography appears as not in EEA for debug devices.
   *
   * @deprecated Use OTHER instead.
   */
  NOT_EEA = 2,
  /** Geography appears as in a regulated US state for debug devices. */
  US = 3,
  /** Geography appears as OTHER for debug devices. */
  OTHER = 4,
}

/**
 * Options for requesting UMP consent information.
 *
 * @since 8.2.0
 */
export type AdmobConsentRequestOptions = {
  /** Sets the debug geography to test consent locally. */
  debugGeography?: AdmobConsentDebugGeography;
  /**
   * Test device IDs to allow for consent debugging.
   * On iOS, the ID may change if you uninstall and reinstall the app.
   */
  testDeviceIdentifiers?: string[];
  /**
   * When true, tags the user as under the age of consent for UMP requests.
   *
   * @default false
   */
  tagForUnderAgeOfConsent?: boolean;
};

/**
 * Consent information returned by UMP.
 *
 * @since 8.2.0
 */
export type AdmobConsentInfo = {
  /** The consent status of the user. */
  status: AdmobConsentStatus;
  /** If true, a consent form is available. */
  isConsentFormAvailable?: boolean;
  /** If true, an ad request can be made. */
  canRequestAds: boolean;
  /** Privacy options requirement status of the user. */
  privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus;
};

/**
 * Tracking authorization status for iOS App Tracking Transparency.
 *
 * @since 1.0.0
 */
export enum TrackingAuthorizationStatus {
  /** User has not yet received an authorization request */
  notDetermined = 0,
  /** User restricted, device is unable to provide authorization */
  restricted = 1,
  /** User denied authorization */
  denied = 2,
  /** User authorized access */
  authorized = 3,
}

/**
 * Base options for mobile ads.
 *
 * @since 1.0.0
 */
export type MobileAdOptions = {
  /** The ad unit ID from AdMob */
  adUnitId: string;
};

/**
 * Server-side verification options for rewarded ads.
 *
 * @since 1.0.0
 */
export type ServerSideVerificationOptions = {
  /**
   * A user identifier included in the server-side verification callback.
   */
  userId?: string;
  /**
   * Custom data included in the server-side verification callback.
   */
  customData?: string;
};

/**
 * Options for rewarded ads.
 *
 * @since 1.0.0
 */
export type RewardedAdOptions = MobileAdOptions & {
  /** Server-side verification options sent with rewarded callbacks. */
  serverSideVerification?: ServerSideVerificationOptions;
};

/**
 * Options for rewarded interstitial ads.
 *
 * @since 1.0.0
 */
export type RewardedInterstitialAdOptions = MobileAdOptions & {
  /** Server-side verification options sent with rewarded callbacks. */
  serverSideVerification?: ServerSideVerificationOptions;
};

/**
 * AdMob Plus Plugin interface for displaying Google AdMob ads in Capacitor apps.
 *
 * @since 1.0.0
 */
export interface AdMobPlusPlugin {
  /**
   * Initialize and start the AdMob SDK.
   *
   * @returns Promise that resolves when the SDK is initialized
   * @throws Error if initialization fails
   * @since 1.0.0
   * @example
   * ```typescript
   * await AdMob.start();
   * ```
   */
  start(): Promise<void>;

  /**
   * Configure AdMob settings.
   *
   * @param config - Configuration options for AdMob
   * @returns Promise that resolves when configuration is applied
   * @throws Error if configuration fails
   * @since 1.0.0
   * @example
   * ```typescript
   * await AdMob.configure({
   *   appMuted: false,
   *   appVolume: 0.5
   * });
   * ```
   */
  configure(config: AdMobConfig): Promise<void>;

  /**
   * Configure ad request settings.
   *
   * @param requestConfig - Request configuration options
   * @returns Promise that resolves when request configuration is applied
   * @throws Error if configuration fails
   * @since 1.0.0
   * @example
   * ```typescript
   * await AdMob.configRequest({
   *   maxAdContentRating: MaxAdContentRating.PG,
   *   tagForChildDirectedTreatment: true,
   *   testDeviceIds: ['test-device-id']
   * });
   * ```
   */
  configRequest(requestConfig: RequestConfig): Promise<void>;

  /**
   * Request user consent information from Google's User Messaging Platform (UMP).
   *
   * Call this after `start()` and before loading ads for users in the EEA/UK.
   *
   * @param options - Optional consent request options for debugging and tagging
   * @returns Promise that resolves with the current consent information
   * @throws Error if the consent info request fails
   * @since 8.2.0
   * @example
   * ```typescript
   * const consentInfo = await AdMob.requestConsentInfo();
   * if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
   *   await AdMob.showConsentForm();
   * }
   * ```
   */
  requestConsentInfo(options?: AdmobConsentRequestOptions): Promise<AdmobConsentInfo>;

  /**
   * Shows the Google user consent form rendered from your GDPR message configuration.
   *
   * @returns Promise that resolves with updated consent information after the form is dismissed
   * @throws Error if the consent form cannot be shown
   * @since 8.2.0
   * @example
   * ```typescript
   * const consentInfo = await AdMob.showConsentForm();
   * if (!consentInfo.canRequestAds) {
   *   return;
   * }
   * ```
   */
  showConsentForm(): Promise<AdmobConsentInfo>;

  /**
   * Shows the Google privacy options form rendered from your GDPR message configuration.
   *
   * Use this when your privacy message requires an in-app entry point for users to manage choices.
   *
   * @returns Promise that resolves when the form is dismissed
   * @throws Error if the privacy options form cannot be shown
   * @since 8.2.0
   * @example
   * ```typescript
   * await AdMob.showPrivacyOptionsForm();
   * ```
   */
  showPrivacyOptionsForm(): Promise<void>;

  /**
   * Create a new ad instance.
   *
   * @param opts - Options for creating the ad, including ad unit ID
   * @returns Promise that resolves when the ad is created
   * @throws Error if ad creation fails
   * @since 1.0.0
   * @example
   * ```typescript
   * await AdMob.adCreate({
   *   adUnitId: 'ca-app-pub-3940256099942544/1033173712'
   * });
   * ```
   */
  adCreate<O extends MobileAdOptions>(opts: O): Promise<void>;

  /**
   * Check if an ad is loaded and ready to be shown.
   *
   * @param opts - Object containing the ad ID
   * @returns Promise that resolves to true if the ad is loaded, false otherwise
   * @throws Error if checking load status fails
   * @since 1.0.0
   * @example
   * ```typescript
   * const isLoaded = await AdMob.adIsLoaded({ id: 1 });
   * if (isLoaded) {
   *   await AdMob.adShow({ id: 1 });
   * }
   * ```
   */
  adIsLoaded(opts: { id: number }): Promise<boolean>;

  /**
   * Load an ad.
   *
   * @param opts - Object containing the ad ID
   * @returns Promise that resolves when the ad is loaded
   * @throws Error if ad loading fails
   * @since 1.0.0
   * @example
   * ```typescript
   * await AdMob.adLoad({ id: 1 });
   * ```
   */
  adLoad(opts: { id: number }): Promise<void>;

  /**
   * Show a loaded ad.
   *
   * @param opts - Object containing the ad ID
   * @returns Promise that resolves when the ad is shown
   * @throws Error if showing the ad fails or if the ad is not loaded
   * @since 1.0.0
   * @example
   * ```typescript
   * await AdMob.adShow({ id: 1 });
   * ```
   */
  adShow(opts: { id: number }): Promise<void>;

  /**
   * Hide a currently displayed ad.
   *
   * @param opts - Object containing the ad ID
   * @returns Promise that resolves when the ad is hidden
   * @throws Error if hiding the ad fails
   * @since 1.0.0
   * @example
   * ```typescript
   * await AdMob.adHide({ id: 1 });
   * ```
   */
  adHide(opts: { id: number }): Promise<void>;

  /**
   * Get the current tracking authorization status (iOS only).
   *
   * @returns Promise that resolves with the current tracking authorization status
   * @throws Error if getting status fails
   * @since 1.0.0
   * @example
   * ```typescript
   * const { status } = await AdMob.trackingAuthorizationStatus();
   * if (status === TrackingAuthorizationStatus.notDetermined) {
   *   await AdMob.requestTrackingAuthorization();
   * }
   * ```
   */
  trackingAuthorizationStatus(): Promise<{
    status: TrackingAuthorizationStatus | false;
  }>;

  /**
   * Request tracking authorization from the user (iOS only).
   *
   * @returns Promise that resolves with the tracking authorization status after the request
   * @throws Error if the request fails
   * @since 1.0.0
   * @example
   * ```typescript
   * const { status } = await AdMob.requestTrackingAuthorization();
   * console.log('User tracking status:', status);
   * ```
   */
  requestTrackingAuthorization(): Promise<{
    status: TrackingAuthorizationStatus | false;
  }>;

  /**
   * Add a listener for ad events.
   *
   * @param eventName - The name of the event to listen for
   * @param listenerFunc - The function to call when the event occurs
   * @returns A promise that resolves to a listener handle
   * @since 1.0.0
   * @example
   * ```typescript
   * const listener = await AdMob.addListener('adLoaded', (event) => {
   *   console.log('Ad loaded:', event);
   * });
   *
   * // Remove listener when done
   * await listener.remove();
   * ```
   */
  addListener(
    eventName: AdMobPlusEventName,
    listenerFunc: (event: any) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;

  /**
   * Get the native Capacitor plugin version.
   *
   * @returns Promise that resolves with the plugin version
   * @throws Error if getting the version fails
   * @since 1.0.0
   * @example
   * ```typescript
   * const { version } = await AdMob.getPluginVersion();
   * console.log('Plugin version:', version);
   * ```
   */
  getPluginVersion(): Promise<{ version: string }>;
}
