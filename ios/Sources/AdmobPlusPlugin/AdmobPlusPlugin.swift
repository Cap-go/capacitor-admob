import Capacitor
import Foundation
import GoogleMobileAds
import AppTrackingTransparency

@objc(AdmobPlusPlugin)
public class AdmobPlusPlugin: CAPPlugin, CAPBridgedPlugin {
    private let pluginVersion: String = "7.4.4"
    public let identifier = "AdmobPlusPlugin"
    public let jsName = "AdMobPlus"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "configure", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "configRequest", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "adCreate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "adIsLoaded", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "adLoad", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "adShow", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "adHide", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "trackingAuthorizationStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestTrackingAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPluginVersion", returnType: CAPPluginReturnPromise)
    ]

    private var nextAdId = 1
    private let adManager = AdManager.shared

    @objc func start(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            GADMobileAds.sharedInstance().start { _ in
                call.resolve()
            }
        }
    }

    @objc func configure(_ call: CAPPluginCall) {
        let appMuted = call.getBool("appMuted")
        let appVolume = call.getFloat("appVolume")

        if let muted = appMuted {
            GADMobileAds.sharedInstance().applicationMuted = muted
        }

        if let volume = appVolume {
            GADMobileAds.sharedInstance().applicationVolume = volume
        }

        call.resolve()
    }

    @objc func configRequest(_ call: CAPPluginCall) {
        let requestConfiguration = GADMobileAds.sharedInstance().requestConfiguration

        if let maxAdContentRating = call.getString("maxAdContentRating") {
            switch maxAdContentRating {
            case "G":
                requestConfiguration.maxAdContentRating = .general
            case "PG":
                requestConfiguration.maxAdContentRating = .parentalGuidance
            case "T":
                requestConfiguration.maxAdContentRating = .teen
            case "MA":
                requestConfiguration.maxAdContentRating = .matureAudience
            default:
                break
            }
        }

        if let tagForChildDirectedTreatment = call.getBool("tagForChildDirectedTreatment") {
            requestConfiguration.tagForChildDirectedTreatment = NSNumber(value: tagForChildDirectedTreatment)
        }

        if let tagForUnderAgeOfConsent = call.getBool("tagForUnderAgeOfConsent") {
            requestConfiguration.tagForUnderAgeOfConsent = NSNumber(value: tagForUnderAgeOfConsent)
        }

        if let testDeviceIds = call.getArray("testDeviceIds", String.self) {
            requestConfiguration.testDeviceIdentifiers = testDeviceIds
        }

        call.resolve()
    }

    @objc func adCreate(_ call: CAPPluginCall) {
        guard let adUnitId = call.getString("adUnitId") else {
            call.reject("adUnitId is required")
            return
        }

        guard let adClass = call.getString("cls") else {
            call.reject("cls (ad class) is required")
            return
        }

        let adId = call.getInt("id") ?? nextAdId
        nextAdId = adId + 1

        let position = call.getString("position") ?? "bottom"

        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                call.reject("Plugin instance not available")
                return
            }

            let ad: Ad?
            switch adClass {
            case "BannerAd":
                ad = BannerAd(id: adId, adUnitId: adUnitId, position: position, plugin: self)
            case "InterstitialAd":
                ad = InterstitialAd(id: adId, adUnitId: adUnitId, plugin: self)
            case "RewardedAd":
                ad = RewardedAd(id: adId, adUnitId: adUnitId, plugin: self)
            case "RewardedInterstitialAd":
                ad = RewardedInterstitialAd(id: adId, adUnitId: adUnitId, plugin: self)
            default:
                call.reject("Unsupported ad class: \(adClass)")
                return
            }

            if let ad = ad {
                self.adManager.addAd(ad, withId: adId)
                call.resolve(["id": adId])
            } else {
                call.reject("Failed to create ad")
            }
        }
    }

    @objc func adIsLoaded(_ call: CAPPluginCall) {
        guard let adId = call.getInt("id") else {
            call.reject("id is required")
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let ad = self?.adManager.getAd(adId) else {
                call.resolve(["value": false])
                return
            }

            call.resolve(["value": ad.isLoaded])
        }
    }

    @objc func adLoad(_ call: CAPPluginCall) {
        guard let adId = call.getInt("id") else {
            call.reject("id is required")
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let ad = self?.adManager.getAd(adId) else {
                call.reject("Ad not found")
                return
            }

            ad.load { error in
                if let error = error {
                    call.reject("Failed to load ad: \(error.localizedDescription)")
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func adShow(_ call: CAPPluginCall) {
        guard let adId = call.getInt("id") else {
            call.reject("id is required")
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let ad = self?.adManager.getAd(adId) else {
                call.reject("Ad not found")
                return
            }

            if !ad.isLoaded {
                call.reject("Ad is not loaded")
                return
            }

            ad.show { error in
                if let error = error {
                    call.reject("Failed to show ad: \(error.localizedDescription)")
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func adHide(_ call: CAPPluginCall) {
        guard let adId = call.getInt("id") else {
            call.reject("id is required")
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let ad = self?.adManager.getAd(adId) else {
                call.reject("Ad not found")
                return
            }

            ad.hide { error in
                if let error = error {
                    call.reject("Failed to hide ad: \(error.localizedDescription)")
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func trackingAuthorizationStatus(_ call: CAPPluginCall) {
        if #available(iOS 14, *) {
            let status = ATTrackingManager.trackingAuthorizationStatus
            call.resolve(["status": status.rawValue])
        } else {
            call.resolve(["status": false])
        }
    }

    @objc func requestTrackingAuthorization(_ call: CAPPluginCall) {
        if #available(iOS 14, *) {
            ATTrackingManager.requestTrackingAuthorization { status in
                call.resolve(["status": status.rawValue])
            }
        } else {
            call.resolve(["status": false])
        }
    }

    @objc func getPluginVersion(_ call: CAPPluginCall) {
        call.resolve(["version": self.pluginVersion])
    }
}
