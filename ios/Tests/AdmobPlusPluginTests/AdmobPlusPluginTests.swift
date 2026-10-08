import XCTest
@testable import AdmobPlusPlugin

class AdmobPlusPluginTests: XCTestCase {
    func testFeedAdManagerSingleton() {
        let manager = FeedAdManager.shared
        XCTAssertNotNil(manager)
    }
}
