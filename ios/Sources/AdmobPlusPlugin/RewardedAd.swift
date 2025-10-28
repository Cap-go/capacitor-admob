import Foundation
import UIKit
import GoogleMobileAds
import Capacitor

class RewardedAd: NSObject, Ad {
    let id: Int
    let adUnitId: String
    private var rewardedAd: GADRewardedAd?
    private weak var plugin: AdmobPlusPlugin?

    var isLoaded: Bool {
        return rewardedAd != nil
    }

    init(id: Int, adUnitId: String, plugin: AdmobPlusPlugin) {
        self.id = id
        self.adUnitId = adUnitId
        self.plugin = plugin
        super.init()
    }

    func load(completion: @escaping (Error?) -> Void) {
        let request = AdMobHelper.buildAdRequest()

        GADRewardedAd.load(withAdUnitID: adUnitId, request: request) { [weak self] ad, error in
            guard let self = self else { return }

            if let error = error {
                self.plugin?.notifyListeners(Events.rewardedLoadFail, data: [
                    "id": self.id,
                    "error": error.localizedDescription
                ])
                completion(error)
                return
            }

            self.rewardedAd = ad
            self.rewardedAd?.fullScreenContentDelegate = self

            self.plugin?.notifyListeners(Events.rewardedLoad, data: ["id": self.id])
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

            rewardedAd.present(fromRootViewController: viewController) { [weak self] in
                guard let self = self else { return }
                let reward = rewardedAd.adReward
                self.plugin?.notifyListeners(Events.rewardedReward, data: [
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
        rewardedAd = nil
    }
}

extension RewardedAd: GADFullScreenContentDelegate {
    func adDidRecordImpression(_ ad: GADFullScreenPresentingAd) {
        plugin?.notifyListeners(Events.rewardedImpression, data: ["id": id])
    }

    func adDidRecordClick(_ ad: GADFullScreenPresentingAd) {
        plugin?.notifyListeners(Events.adClick, data: ["id": id])
    }

    func ad(_ ad: GADFullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        plugin?.notifyListeners(Events.rewardedShowFail, data: [
            "id": id,
            "error": error.localizedDescription
        ])
    }

    func adWillPresentFullScreenContent(_ ad: GADFullScreenPresentingAd) {
        plugin?.notifyListeners(Events.rewardedShow, data: ["id": id])
    }

    func adDidDismissFullScreenContent(_ ad: GADFullScreenPresentingAd) {
        plugin?.notifyListeners(Events.rewardedDismiss, data: ["id": id])
        rewardedAd = nil
    }
}
