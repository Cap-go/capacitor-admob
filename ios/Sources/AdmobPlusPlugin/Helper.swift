import Foundation
import GoogleMobileAds

class AdManager {
    static let shared = AdManager()
    private var ads: [Int: Ad] = [:]

    private init() {}

    func addAd(_ ad: Ad, withId id: Int) {
        ads[id] = ad
    }

    func getAd(_ id: Int) -> Ad? {
        return ads[id]
    }

    func removeAd(_ id: Int) {
        ads.removeValue(forKey: id)
    }
}

protocol Ad {
    var id: Int { get }
    var adUnitId: String { get }
    var isLoaded: Bool { get }

    func load(completion: @escaping (Error?) -> Void)
    func show(completion: @escaping (Error?) -> Void)
    func hide(completion: @escaping (Error?) -> Void)
    func destroy()
}

extension Ad {
    func hide(completion: @escaping (Error?) -> Void) {
        completion(NSError(domain: "AdMobPlus", code: -1, userInfo: [NSLocalizedDescriptionKey: "Hide not supported for this ad type"]))
    }
}

class AdMobHelper {
    static func buildAdRequest() -> GADRequest {
        let request = GADRequest()
        return request
    }
}

enum AdMobError: Error {
    case adNotFound
    case adNotLoaded
    case adAlreadyExists
    case invalidAdType
    case unknown(String)

    var localizedDescription: String {
        switch self {
        case .adNotFound:
            return "Ad not found"
        case .adNotLoaded:
            return "Ad is not loaded"
        case .adAlreadyExists:
            return "Ad already exists"
        case .invalidAdType:
            return "Invalid ad type"
        case .unknown(let message):
            return message
        }
    }
}
