import Foundation
import UIKit
import GoogleMobileAds
import Capacitor

class RewardedInterstitialAd: NSObject, Ad {
    let id: Int
    let adUnitId: String
    private let serverSideVerificationOptions: ServerSideVerificationOptions?
    private var rewardedInterstitialAd: GoogleMobileAds.RewardedInterstitialAd?
    private weak var plugin: AdmobPlusPlugin?

    var isLoaded: Bool {
        return rewardedInterstitialAd != nil
    }

    init(id: Int, adUnitId: String, serverSideVerificationOptions: ServerSideVerificationOptions?, plugin: AdmobPlusPlugin) {
        self.id = id
        self.adUnitId = adUnitId
        self.serverSideVerificationOptions = serverSideVerificationOptions
        self.plugin = plugin
        super.init()
    }

    func load(completion: @escaping (Error?) -> Void) {
        let request = AdMobHelper.buildAdRequest()

        GoogleMobileAds.RewardedInterstitialAd.load(with: adUnitId, request: request) { [weak self] ad, error in
            guard let self = self else { return }

            if let error = error {
                self.plugin?.notifyAdFailureListeners(Events.rewardedInterstitialLoadFail, adId: self.id, error: error)
                completion(error)
                return
            }

            self.rewardedInterstitialAd = ad
            self.rewardedInterstitialAd?.serverSideVerificationOptions = self.serverSideVerificationOptions
            self.rewardedInterstitialAd?.fullScreenContentDelegate = self

            self.plugin?.notifyAdListeners(Events.rewardedInterstitialLoad, adId: self.id)
            completion(nil)
        }
    }

    func show(completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let rewardedInterstitialAd = self.rewardedInterstitialAd else {
                completion(AdMobError.adNotLoaded)
                return
            }

            guard let viewController = self.plugin?.bridge?.viewController else {
                completion(AdMobError.unknown("Unable to access view controller"))
                return
            }

            rewardedInterstitialAd.present(from: viewController) { [weak self] in
                guard let self = self else { return }
                let reward = rewardedInterstitialAd.adReward
                self.plugin?.notifyAdRewardListeners(
                    Events.rewardedInterstitialReward,
                    adId: self.id,
                    amount: reward.amount.intValue,
                    type: reward.type
                )
            }
            completion(nil)
        }
    }

    func destroy() {
        rewardedInterstitialAd = nil
    }
}

extension RewardedInterstitialAd: FullScreenContentDelegate {
    func adDidRecordImpression(_ ad: FullScreenPresentingAd) {
        plugin?.notifyAdListeners(Events.rewardedInterstitialImpression, adId: id)
    }

    func adDidRecordClick(_ ad: FullScreenPresentingAd) {
        plugin?.notifyAdListeners(Events.adClick, adId: id)
    }

    func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        plugin?.notifyAdFailureListeners(Events.rewardedInterstitialShowFail, adId: id, error: error)
    }

    func adWillPresentFullScreenContent(_ ad: FullScreenPresentingAd) {
        plugin?.notifyAdListeners(Events.rewardedInterstitialShow, adId: id)
    }

    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        plugin?.notifyAdListeners(Events.rewardedInterstitialDismiss, adId: id)
        rewardedInterstitialAd = nil
    }
}
