import Capacitor
import Foundation

@objc(AdmobPlusPlugin)
public class AdmobPlusPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AdmobPlusPlugin"
    public let jsName = "AdMobPlus"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = AdmobPlus()

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve([
            "value": implementation.echo(value)
        ])
    }
}
