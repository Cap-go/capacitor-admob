import XCTest
@testable import AdmobPlusPlugin

final class FeedAdEngineInstallPolicyTests: XCTestCase {
    func testEngineOffDoesNotRequireInstall() {
        XCTAssertFalse(FeedAdEngineInstallPolicy.shouldInstall(useEngine: false, channelInstalled: false))
        XCTAssertFalse(FeedAdEngineInstallPolicy.shouldInstall(useEngine: false, channelInstalled: true))
    }

    func testEngineOnInstallsWhenChannelMissing() {
        XCTAssertTrue(FeedAdEngineInstallPolicy.shouldInstall(useEngine: true, channelInstalled: false))
        XCTAssertFalse(FeedAdEngineInstallPolicy.shouldInstall(useEngine: true, channelInstalled: true))
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