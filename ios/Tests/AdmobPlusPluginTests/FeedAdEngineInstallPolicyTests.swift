import XCTest
#if canImport(CapgoCapacitorAdmob)
@testable import CapgoCapacitorAdmob
#else
@testable import AdmobPlusPlugin
#endif

final class FeedAdEngineInstallPolicyTests: XCTestCase {
    func testEngineOffDoesNotRequireInstall() {
        XCTAssertFalse(FeedAdManager.shouldInstallEngineChannel(useEngine: false, channelInstalled: false))
        XCTAssertFalse(FeedAdManager.shouldInstallEngineChannel(useEngine: false, channelInstalled: true))
    }

    func testEngineOnInstallsWhenChannelMissing() {
        XCTAssertTrue(FeedAdManager.shouldInstallEngineChannel(useEngine: true, channelInstalled: false))
        XCTAssertFalse(FeedAdManager.shouldInstallEngineChannel(useEngine: true, channelInstalled: true))
    }

    #if canImport(WebViewNativeUIEngine)
    func testWebViewNativeUIEngineModuleIsLinked() {
        XCTAssertTrue(FeedAdEngineInstallPolicy.engineModuleLinked)
    }
    #else
    func testWebViewNativeUIEngineModuleNotRequiredForCore() {
        XCTAssertFalse(FeedAdEngineInstallPolicy.engineModuleLinked)
    }
    #endif
}