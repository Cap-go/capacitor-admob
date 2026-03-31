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
                self.plugin?.notifyListeners(Events.rewardedInterstitialLoadFail, data: [
                    "id": self.id,
                    "error": error.localizedDescription
                ])
                completion(error)
                return
            }

            self.rewardedInterstitialAd = ad
            self.rewardedInterstitialAd?.serverSideVerificationOptions = self.serverSideVerificationOptions
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

            rewardedInterstitialAd.present(from: viewController) { [weak self] in
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

extension RewardedInterstitialAd: FullScreenContentDelegate {
    func adDidRecordImpression(_ ad: FullScreenPresentingAd) {
        plugin?.notifyListeners(Events.rewardedInterstitialImpression, data: ["id": id])
    }

    func adDidRecordClick(_ ad: FullScreenPresentingAd) {
        plugin?.notifyListeners(Events.adClick, data: ["id": id])
    }

    func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        plugin?.notifyListeners(Events.rewardedInterstitialShowFail, data: [
            "id": id,
            "error": error.localizedDescription
        ])
    }

    func adWillPresentFullScreenContent(_ ad: FullScreenPresentingAd) {
        plugin?.notifyListeners(Events.rewardedInterstitialShow, data: ["id": id])
    }

    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        plugin?.notifyListeners(Events.rewardedInterstitialDismiss, data: ["id": id])
        rewardedInterstitialAd = nil
    }
}
