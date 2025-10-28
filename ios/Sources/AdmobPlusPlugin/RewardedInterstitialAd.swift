import Foundation
import UIKit
import GoogleMobileAds
import Capacitor

class RewardedInterstitialAd: NSObject, Ad {
    let id: Int
    let adUnitId: String
    private var rewardedInterstitialAd: GADRewardedInterstitialAd?
    private weak var plugin: AdmobPlusPlugin?

    var isLoaded: Bool {
        return rewardedInterstitialAd != nil
    }

    init(id: Int, adUnitId: String, plugin: AdmobPlusPlugin) {
        self.id = id
        self.adUnitId = adUnitId
        self.plugin = plugin
        super.init()
    }

    func load(completion: @escaping (Error?) -> Void) {
        let request = AdMobHelper.buildAdRequest()

        GADRewardedInterstitialAd.load(withAdUnitID: adUnitId, request: request) { [weak self] ad, error in
            guard let self = self else { return }

            if let error = error {
                self.plugin?.notifyListeners(Events.rewardedInterstitialLoadFail, data: [
                    "id": self.id,
                    "error": error.localizedDescription
                ])
                completion(error)
                return
            }

            self.rewardedInterstitialAd = ad
            self.rewardedInterstitialAd?.fullScreenContentDelegate = self

            self.plugin?.notifyListeners(Events.rewardedInterstitialLoad, data: ["id": self.id])
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

            rewardedInterstitialAd.present(fromRootViewController: viewController) { [weak self] in
                guard let self = self else { return }
                let reward = rewardedInterstitialAd.adReward
                self.plugin?.notifyListeners(Events.rewardedInterstitialReward, data: [
                    "id": self.id,
                    "reward": [
                        "amount": reward.amount.intValue,
                        "type": reward.type
                    ]
                ])
            }
            completion(nil)
        }
    }

    func destroy() {
        rewardedInterstitialAd = nil
    }
}

extension RewardedInterstitialAd: GADFullScreenContentDelegate {
    func adDidRecordImpression(_ ad: GADFullScreenPresentingAd) {
        plugin?.notifyListeners(Events.rewardedInterstitialImpression, data: ["id": id])
    }

    func adDidRecordClick(_ ad: GADFullScreenPresentingAd) {
        plugin?.notifyListeners(Events.adClick, data: ["id": id])
    }

    func ad(_ ad: GADFullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        plugin?.notifyListeners(Events.rewardedInterstitialShowFail, data: [
            "id": id,
            "error": error.localizedDescription
        ])
    }

    func adWillPresentFullScreenContent(_ ad: GADFullScreenPresentingAd) {
        plugin?.notifyListeners(Events.rewardedInterstitialShow, data: ["id": id])
    }

    func adDidDismissFullScreenContent(_ ad: GADFullScreenPresentingAd) {
        plugin?.notifyListeners(Events.rewardedInterstitialDismiss, data: ["id": id])
        rewardedInterstitialAd = nil
    }
}
