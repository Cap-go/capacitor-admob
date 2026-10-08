import Foundation
import UIKit
import GoogleMobileAds
import Capacitor

class InterstitialAd: NSObject, Ad {
    let id: Int
    let adUnitId: String
    private var interstitial: GoogleMobileAds.InterstitialAd?
    private weak var plugin: AdmobPlusPlugin?

    var isLoaded: Bool {
        return interstitial != nil
    }

    init(id: Int, adUnitId: String, plugin: AdmobPlusPlugin) {
        self.id = id
        self.adUnitId = adUnitId
        self.plugin = plugin
        super.init()
    }

    func load(completion: @escaping (Error?) -> Void) {
        let request = AdMobHelper.buildAdRequest()

        GoogleMobileAds.InterstitialAd.load(with: adUnitId, request: request) { [weak self] ad, error in
            guard let self = self else { return }

            if let error = error {
                self.plugin?.notifyAdFailureListeners(Events.interstitialLoadFail, adId: self.id, error: error)
                completion(error)
                return
            }

            self.interstitial = ad
            self.interstitial?.fullScreenContentDelegate = self

            self.plugin?.notifyAdListeners(Events.interstitialLoad, adId: self.id)
            completion(nil)
        }
    }

    func show(completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let interstitial = self.interstitial else {
                completion(AdMobError.adNotLoaded)
                return
            }

            guard let viewController = self.plugin?.bridge?.viewController else {
                completion(AdMobError.unknown("Unable to access view controller"))
                return
            }

            interstitial.present(from: viewController)
            completion(nil)
        }
    }

    func destroy() {
        interstitial = nil
    }
}

extension InterstitialAd: FullScreenContentDelegate {
    func adDidRecordImpression(_ ad: FullScreenPresentingAd) {
        plugin?.notifyAdListeners(Events.interstitialImpression, adId: id)
    }

    func adDidRecordClick(_ ad: FullScreenPresentingAd) {
        plugin?.notifyAdListeners(Events.adClick, adId: id)
    }

    func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        plugin?.notifyAdFailureListeners(Events.interstitialShowFail, adId: id, error: error)
    }

    func adWillPresentFullScreenContent(_ ad: FullScreenPresentingAd) {
        plugin?.notifyAdListeners(Events.interstitialShow, adId: id)
    }

    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        plugin?.notifyAdListeners(Events.interstitialDismiss, adId: id)
        interstitial = nil
    }
}
