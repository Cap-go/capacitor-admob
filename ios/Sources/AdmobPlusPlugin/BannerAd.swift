import Foundation
import UIKit
import GoogleMobileAds
import Capacitor

class BannerAd: NSObject, Ad {
    let id: Int
    let adUnitId: String
    private var bannerView: GADBannerView?
    private weak var plugin: AdmobPlusPlugin?
    private let position: String
    private var bannerContainer: UIView?

    var isLoaded: Bool {
        return bannerView != nil
    }

    init(id: Int, adUnitId: String, position: String, plugin: AdmobPlusPlugin) {
        self.id = id
        self.adUnitId = adUnitId
        self.position = position
        self.plugin = plugin
        super.init()
    }

    func load(completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            if self.bannerView == nil {
                let banner = GADBannerView(adSize: GADAdSizeBanner)
                banner.adUnitID = self.adUnitId
                banner.delegate = self
                banner.rootViewController = self.plugin?.bridge?.viewController
                self.bannerView = banner
            }

            let request = AdMobHelper.buildAdRequest()
            self.bannerView?.load(request)
            completion(nil)
        }
    }

    func show(completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let banner = self.bannerView else {
                completion(AdMobError.adNotLoaded)
                return
            }

            guard let webView = self.plugin?.bridge?.webView,
                  let viewController = self.plugin?.bridge?.viewController else {
                completion(AdMobError.unknown("Unable to access view hierarchy"))
                return
            }

            // Remove existing container if any
            self.bannerContainer?.removeFromSuperview()

            // Create a new container
            let container = UIView()
            container.translatesAutoresizingMaskIntoConstraints = false
            banner.translatesAutoresizingMaskIntoConstraints = false

            container.addSubview(banner)

            // Add container to the view hierarchy
            viewController.view.addSubview(container)

            // Setup constraints
            NSLayoutConstraint.activate([
                container.leadingAnchor.constraint(equalTo: viewController.view.leadingAnchor),
                container.trailingAnchor.constraint(equalTo: viewController.view.trailingAnchor),
                container.heightAnchor.constraint(equalToConstant: 50),

                banner.centerXAnchor.constraint(equalTo: container.centerXAnchor),
                banner.centerYAnchor.constraint(equalTo: container.centerYAnchor)
            ])

            if self.position == "top" {
                NSLayoutConstraint.activate([
                    container.topAnchor.constraint(equalTo: viewController.view.safeAreaLayoutGuide.topAnchor)
                ])
            } else {
                NSLayoutConstraint.activate([
                    container.bottomAnchor.constraint(equalTo: viewController.view.safeAreaLayoutGuide.bottomAnchor)
                ])
            }

            self.bannerContainer = container
            container.isHidden = false
            banner.isHidden = false

            completion(nil)
        }
    }

    func hide(completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            self?.bannerContainer?.isHidden = true
            self?.bannerView?.isHidden = true
            completion(nil)
        }
    }

    func destroy() {
        DispatchQueue.main.async { [weak self] in
            self?.bannerContainer?.removeFromSuperview()
            self?.bannerView?.removeFromSuperview()
            self?.bannerView = nil
            self?.bannerContainer = nil
        }
    }
}

extension BannerAd: GADBannerViewDelegate {
    func bannerViewDidReceiveAd(_ bannerView: GADBannerView) {
        plugin?.notifyListeners(Events.bannerLoad, data: ["id": id])
    }

    func bannerView(_ bannerView: GADBannerView, didFailToReceiveAdWithError error: Error) {
        plugin?.notifyListeners(Events.bannerLoadFail, data: [
            "id": id,
            "error": error.localizedDescription
        ])
    }

    func bannerViewDidRecordImpression(_ bannerView: GADBannerView) {
        plugin?.notifyListeners(Events.bannerImpression, data: ["id": id])
    }

    func bannerViewWillPresentScreen(_ bannerView: GADBannerView) {
        plugin?.notifyListeners(Events.bannerOpen, data: ["id": id])
    }

    func bannerViewWillDismissScreen(_ bannerView: GADBannerView) {
        plugin?.notifyListeners(Events.bannerClose, data: ["id": id])
    }

    func bannerViewDidRecordClick(_ bannerView: GADBannerView) {
        plugin?.notifyListeners(Events.bannerClick, data: ["id": id])
    }
}
