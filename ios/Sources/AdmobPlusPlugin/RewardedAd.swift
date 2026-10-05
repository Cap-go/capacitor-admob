import Foundation
import UIKit
import GoogleMobileAds
import Capacitor

class RewardedAd: NSObject, Ad {
    let id: Int
    let adUnitId: String
    private let serverSideVerificationOptions: ServerSideVerificationOptions?
    private var rewardedAd: GoogleMobileAds.RewardedAd?
    private weak var plugin: AdmobPlusPlugin?

    var isLoaded: Bool {
        return rewardedAd != nil
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

        GoogleMobileAds.RewardedAd.load(with: adUnitId, request: request) { [weak self] ad, error in
            guard let self = self else { return }

            if let error = error {
                self.plugin?.notifyAdFailureListeners(Events.rewardedLoadFail, adId: self.id, error: error)
                completion(error)
                return
            }

            self.rewardedAd = ad
            self.rewardedAd?.serverSideVerificationOptions = self.serverSideVerificationOptions
            self.rewardedAd?.fullScreenContentDelegate = self

            self.plugin?.notifyAdListeners(Events.rewardedLoad, adId: self.id)
            completion(nil)
        }
    }

    func show(completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let rewardedAd = self.rewardedAd else {
                completion(AdMobError.adNotLoaded)
                return
            }

            guard let viewController = self.plugin?.bridge?.viewController else {
                completion(AdMobError.unknown("Unable to access view controller"))
                return
            }

            rewardedAd.present(from: viewController) { [weak self] in
                guard let self = self else { return }
                let reward = rewardedAd.adReward
                self.plugin?.notifyAdRewardListeners(
                    Events.rewardedReward,
                    adId: self.id,
                    amount: reward.amount.intValue,
                    type: reward.type
                )
            }
            completion(nil)
        }
    }

    func destroy() {
        rewardedAd = nil
    }
}

extension RewardedAd: FullScreenContentDelegate {
    func adDidRecordImpression(_ ad: FullScreenPresentingAd) {
        plugin?.notifyAdListeners(Events.rewardedImpression, adId: id)
    }

    func adDidRecordClick(_ ad: FullScreenPresentingAd) {
        plugin?.notifyAdListeners(Events.adClick, adId: id)
    }

    func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        plugin?.notifyAdFailureListeners(Events.rewardedShowFail, adId: id, error: error)
    }

    func adWillPresentFullScreenContent(_ ad: FullScreenPresentingAd) {
        plugin?.notifyAdListeners(Events.rewardedShow, adId: id)
    }

    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        plugin?.notifyAdListeners(Events.rewardedDismiss, adId: id)
        rewardedAd = nil
    }
}
