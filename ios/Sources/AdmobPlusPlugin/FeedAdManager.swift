import Foundation
import UIKit
import GoogleMobileAds
import Capacitor

private let minAutoRefreshMs = 30_000

final class FeedAdManager {
    static let shared = FeedAdManager()
    private var entries: [Int: FeedAdEntry] = [:]
    private var nextId = 1

    private init() {}

    func create(
        format: String,
        adUnitId: String,
        positionKey: String?,
        autoRefreshMs: Int?,
        nativeStyle: [String: String]?,
        plugin: AdmobPlusPlugin
    ) -> Int {
        let id = nextId
        nextId += 1
        let entry = FeedAdEntry(
            id: id,
            format: format == "banner" ? .banner : .native,
            adUnitId: adUnitId,
            positionKey: positionKey,
            nativeStyle: nativeStyle ?? [:],
            plugin: plugin
        )
        if let ms = autoRefreshMs {
            entry.setAutoRefresh(ms: ms)
        }
        entries[id] = entry
        return id
    }

    func destroy(id: Int) {
        entries[id]?.destroy()
        entries.removeValue(forKey: id)
    }

    func load(id: Int, completion: @escaping (Error?) -> Void) {
        guard let entry = entries[id] else {
            completion(AdMobError.adNotFound)
            return
        }
        entry.load(completion: completion)
    }

    func isLoaded(id: Int) -> Bool {
        entries[id]?.isLoaded ?? false
    }

    func updateBounds(id: Int, x: Double, y: Double, width: Double, height: Double, visible: Bool) {
        entries[id]?.updateBounds(x: x, y: y, width: width, height: height, visible: visible)
    }

    func setAutoRefresh(id: Int, autoRefreshMs: Int?) {
        entries[id]?.setAutoRefresh(ms: autoRefreshMs)
    }
}

private enum FeedAdFormat {
    case native
    case banner
}

private final class FeedAdEntry: NSObject {
    let id: Int
    let format: FeedAdFormat
    let adUnitId: String
    let positionKey: String?
    let nativeStyle: [String: String]
    weak var plugin: AdmobPlusPlugin?

    private var overlayContainer: UIView?
    private var nativeAdView: NativeAdView?
    private var nativeAd: NativeAd?
    private var adLoader: AdLoader?
    private var bannerView: BannerView?
    private var loaded = false
    private var refreshTimer: Timer?
    private var autoRefreshMs: Int?
    private var loadCompletion: ((Error?) -> Void)?

    init(
        id: Int,
        format: FeedAdFormat,
        adUnitId: String,
        positionKey: String?,
        nativeStyle: [String: String],
        plugin: AdmobPlusPlugin
    ) {
        self.id = id
        self.format = format
        self.adUnitId = adUnitId
        self.positionKey = positionKey
        self.nativeStyle = nativeStyle
        self.plugin = plugin
        super.init()
    }

    var isLoaded: Bool { loaded }

    func load(completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async {
            self.loadCompletion = completion
            switch self.format {
            case .native:
                self.loadNative()
            case .banner:
                self.loadBanner()
            }
        }
    }

    private func finishLoad(error: Error?) {
        let completion = loadCompletion
        loadCompletion = nil
        completion?(error)
    }

    func destroy() {
        refreshTimer?.invalidate()
        refreshTimer = nil
        nativeAd = nil
        nativeAdView?.removeFromSuperview()
        nativeAdView = nil
        bannerView?.removeFromSuperview()
        bannerView = nil
        overlayContainer?.removeFromSuperview()
        overlayContainer = nil
        loaded = false
    }

    func setAutoRefresh(ms: Int?) {
        refreshTimer?.invalidate()
        refreshTimer = nil
        autoRefreshMs = ms
        guard let ms = ms, ms >= minAutoRefreshMs else { return }
        refreshTimer = Timer.scheduledTimer(withTimeInterval: Double(ms) / 1000.0, repeats: true) { [weak self] _ in
            self?.plugin?.notifyFeedListeners(Events.feedRefresh, feedAdId: self?.id ?? 0, positionKey: self?.positionKey, format: self?.formatString)
            self?.load { _ in }
        }
    }

    func updateBounds(x: Double, y: Double, width: Double, height: Double, visible: Bool) {
        DispatchQueue.main.async {
            guard let webView = self.plugin?.bridge?.webView,
                  let rootView = self.plugin?.bridge?.viewController?.view else { return }

            let container = self.ensureOverlayContainer(on: rootView, below: webView)
            let originY = webView.frame.origin.y + CGFloat(y)
            let frame = CGRect(x: CGFloat(x), y: originY, width: CGFloat(width), height: CGFloat(height))
            let target = self.nativeAdView ?? self.bannerView
            target?.frame = frame
            container.isHidden = !visible || !self.loaded
            container.frame = rootView.bounds
        }
    }

    private var formatString: String {
        format == .banner ? "banner" : "native"
    }

    private func ensureOverlayContainer(on rootView: UIView, below webView: UIView) -> UIView {
        if let overlayContainer = overlayContainer {
            return overlayContainer
        }
        let container = UIView(frame: rootView.bounds)
        container.backgroundColor = .clear
        container.isUserInteractionEnabled = true
        container.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        rootView.insertSubview(container, aboveSubview: webView)
        overlayContainer = container
        return container
    }

    private func loadNative() {
        guard let viewController = plugin?.bridge?.viewController else {
            finishLoad(error: AdMobError.unknown("Unable to access view controller"))
            return
        }

        adLoader = AdLoader(
            adUnitID: adUnitId,
            rootViewController: viewController,
            adTypes: [.native],
            options: nil
        )
        adLoader?.delegate = self
        adLoader?.load(AdMobHelper.buildAdRequest())
    }

    private func loadBanner() {
        if bannerView == nil {
            let banner = BannerView(adSize: AdSizeBanner)
            banner.adUnitID = adUnitId
            banner.delegate = self
            banner.rootViewController = plugin?.bridge?.viewController
            bannerView = banner
            if let root = plugin?.bridge?.viewController?.view,
               let webView = plugin?.bridge?.webView {
                let container = ensureOverlayContainer(on: root, below: webView)
                container.addSubview(banner)
            }
        }
        loaded = false
        bannerView?.load(AdMobHelper.buildAdRequest())
    }

    private func displayNativeAd(_ nativeAd: NativeAd) {
        self.nativeAd = nativeAd
        nativeAd.delegate = self

        guard let root = plugin?.bridge?.viewController?.view,
              let webView = plugin?.bridge?.webView else { return }

        nativeAdView?.removeFromSuperview()
        let adView = buildNativeAdView(for: nativeAd)
        let container = ensureOverlayContainer(on: root, below: webView)
        container.addSubview(adView)
        nativeAdView = adView
        loaded = true
        container.isHidden = false

        let assets: [String: Any] = [
            "headline": nativeAd.headline ?? "",
            "body": nativeAd.body ?? "",
            "callToAction": nativeAd.callToAction ?? "",
            "advertiser": nativeAd.advertiser ?? "",
            "price": nativeAd.price ?? "",
            "store": nativeAd.store ?? "",
            "starRating": nativeAd.starRating ?? 0,
            "mediaAspectRatio": nativeAd.mediaContent.aspectRatio,
        ]
        plugin?.notifyFeedLoad(feedAdId: id, positionKey: positionKey, format: formatString, assets: assets)
        finishLoad(error: nil)
    }

    private func buildNativeAdView(for nativeAd: NativeAd) -> NativeAdView {
        let adView = NativeAdView()
        adView.backgroundColor = color(from: nativeStyle["backgroundColor"]) ?? UIColor.secondarySystemBackground
        adView.layer.cornerRadius = 12
        adView.clipsToBounds = true

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 8
        stack.translatesAutoresizingMaskIntoConstraints = false
        adView.addSubview(stack)

        let attribution = UILabel()
        attribution.text = "Ad"
        attribution.font = .systemFont(ofSize: 10, weight: .semibold)
        attribution.textColor = .secondaryLabel
        attribution.textAlignment = .right
        stack.addArrangedSubview(attribution)

        let mediaView = MediaView()
        mediaView.mediaContent = nativeAd.mediaContent
        mediaView.translatesAutoresizingMaskIntoConstraints = false
        mediaView.heightAnchor.constraint(equalToConstant: 180).isActive = true
        adView.mediaView = mediaView
        stack.addArrangedSubview(mediaView)

        let headline = UILabel()
        headline.font = .boldSystemFont(ofSize: 16)
        headline.textColor = color(from: nativeStyle["headlineTextColor"]) ?? .label
        headline.text = nativeAd.headline
        headline.numberOfLines = 2
        adView.headlineView = headline
        stack.addArrangedSubview(headline)

        if let bodyText = nativeAd.body {
            let body = UILabel()
            body.font = .systemFont(ofSize: 14)
            body.textColor = color(from: nativeStyle["bodyTextColor"]) ?? .secondaryLabel
            body.text = bodyText
            body.numberOfLines = 3
            adView.bodyView = body
            stack.addArrangedSubview(body)
        }

        let cta = UIButton(type: .system)
        cta.setTitle(nativeAd.callToAction, for: .normal)
        cta.backgroundColor = color(from: nativeStyle["ctaBackgroundColor"]) ?? .systemBlue
        cta.setTitleColor(color(from: nativeStyle["ctaTextColor"]) ?? .white, for: .normal)
        cta.layer.cornerRadius = 8
        cta.isUserInteractionEnabled = false
        cta.contentEdgeInsets = UIEdgeInsets(top: 10, left: 12, bottom: 10, right: 12)
        adView.callToActionView = cta
        stack.addArrangedSubview(cta)

        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: adView.leadingAnchor, constant: 12),
            stack.trailingAnchor.constraint(equalTo: adView.trailingAnchor, constant: -12),
            stack.topAnchor.constraint(equalTo: adView.topAnchor, constant: 12),
            stack.bottomAnchor.constraint(equalTo: adView.bottomAnchor, constant: -12),
        ])

        adView.nativeAd = nativeAd
        return adView
    }

    private func color(from hex: String?) -> UIColor? {
        guard let hex = hex?.trimmingCharacters(in: .whitespacesAndNewlines), hex.hasPrefix("#"), hex.count == 7 else {
            return nil
        }
        var rgb: UInt64 = 0
        Scanner(string: String(hex.dropFirst())).scanHexInt64(&rgb)
        return UIColor(
            red: CGFloat((rgb & 0xFF0000) >> 16) / 255,
            green: CGFloat((rgb & 0x00FF00) >> 8) / 255,
            blue: CGFloat(rgb & 0x0000FF) / 255,
            alpha: 1
        )
    }
}

extension FeedAdEntry: AdLoaderDelegate {
    func adLoader(_ adLoader: AdLoader, didFailToReceiveAdWithError error: Error) {
        plugin?.notifyFeedFailure(Events.feedLoadFail, feedAdId: id, positionKey: positionKey, format: formatString, error: error)
        loaded = false
        finishLoad(error: error)
    }
}

extension FeedAdEntry: NativeAdLoaderDelegate {
    func adLoader(_ adLoader: AdLoader, didReceive nativeAd: NativeAd) {
        displayNativeAd(nativeAd)
    }
}

extension FeedAdEntry: NativeAdDelegate {
    func nativeAdDidRecordClick(_ nativeAd: NativeAd) {
        plugin?.notifyFeedListeners(Events.feedClick, feedAdId: id, positionKey: positionKey, format: formatString)
    }

    func nativeAdDidRecordImpression(_ nativeAd: NativeAd) {
        plugin?.notifyFeedListeners(Events.feedImpression, feedAdId: id, positionKey: positionKey, format: formatString)
    }
}

extension FeedAdEntry: BannerViewDelegate {
    func bannerViewDidReceiveAd(_ bannerView: BannerView) {
        loaded = true
        overlayContainer?.isHidden = false
        let assets: [String: Any] = [
            "width": bannerView.adSize.size.width,
            "height": bannerView.adSize.size.height,
        ]
        plugin?.notifyFeedLoad(feedAdId: id, positionKey: positionKey, format: formatString, assets: assets)
        finishLoad(error: nil)
    }

    func bannerView(_ bannerView: BannerView, didFailToReceiveAdWithError error: Error) {
        plugin?.notifyFeedFailure(Events.feedLoadFail, feedAdId: id, positionKey: positionKey, format: formatString, error: error)
        loaded = false
        finishLoad(error: error)
    }

    func bannerViewDidRecordImpression(_ bannerView: BannerView) {
        plugin?.notifyFeedListeners(Events.feedImpression, feedAdId: id, positionKey: positionKey, format: formatString)
    }

    func bannerViewDidRecordClick(_ bannerView: BannerView) {
        plugin?.notifyFeedListeners(Events.feedClick, feedAdId: id, positionKey: positionKey, format: formatString)
    }

    func bannerViewWillPresentScreen(_ bannerView: BannerView) {
        plugin?.notifyFeedListeners(Events.feedOpen, feedAdId: id, positionKey: positionKey, format: formatString)
    }

    func bannerViewWillDismissScreen(_ bannerView: BannerView) {
        plugin?.notifyFeedListeners(Events.feedClose, feedAdId: id, positionKey: positionKey, format: formatString)
    }
}

extension AdmobPlusPlugin {
    func notifyFeedListeners(_ eventName: String, feedAdId: Int, positionKey: String?, format: String?) {
        var data: [String: Any] = ["feedAdId": feedAdId]
        if let positionKey = positionKey {
            data["positionKey"] = positionKey
        }
        if let format = format {
            data["format"] = format
        }
        notifyListeners(eventName, data: data)
    }

    func notifyFeedLoad(feedAdId: Int, positionKey: String?, format: String?, assets: [String: Any]) {
        var data: [String: Any] = ["feedAdId": feedAdId, "assets": assets]
        if let positionKey = positionKey {
            data["positionKey"] = positionKey
        }
        if let format = format {
            data["format"] = format
        }
        notifyListeners(Events.feedLoad, data: data)
    }

    func notifyFeedFailure(
        _ eventName: String,
        feedAdId: Int,
        positionKey: String?,
        format: String?,
        error: Error
    ) {
        let nsError = error as NSError
        var data: [String: Any] = [
            "feedAdId": feedAdId,
            "code": nsError.code,
            "message": nsError.localizedDescription,
        ]
        if let positionKey = positionKey {
            data["positionKey"] = positionKey
        }
        if let format = format {
            data["format"] = format
        }
        notifyListeners(eventName, data: data)
    }
}
