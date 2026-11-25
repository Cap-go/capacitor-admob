import XCTest
#if canImport(CapgoCapacitorAdmob)
@testable import CapgoCapacitorAdmob
#else
@testable import AdmobPlusPlugin
#endif

class AdmobPlusPluginTests: XCTestCase {
    func testFeedAdManagerSingleton() {
        let manager = FeedAdManager.shared
        XCTAssertNotNil(manager)
    }
}
