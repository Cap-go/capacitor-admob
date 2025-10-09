import XCTest
@testable import AdmobPlusPlugin

class AdmobPlusPluginTests: XCTestCase {
    func testEcho() {
        let implementation = AdmobPlus()
        let value = "Hello, World!"
        let result = implementation.echo(value)

        XCTAssertEqual(value, result)
    }
}
