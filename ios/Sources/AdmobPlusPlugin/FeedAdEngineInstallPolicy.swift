import Foundation

enum FeedAdEngineInstallPolicy {
    static var engineModuleLinked: Bool {
        #if canImport(WebViewNativeUIEngine)
        return true
        #else
        return false
        #endif
    }

    static func shouldInstall(useEngine: Bool, channelInstalled: Bool) -> Bool {
        useEngine && !channelInstalled
    }
}