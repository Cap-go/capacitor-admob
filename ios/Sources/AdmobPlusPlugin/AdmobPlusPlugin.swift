import Capacitor
import Foundation

@objc(AdmobPlusPlugin)
public class AdmobPlusPlugin: CAPPlugin, CAPBridgedPlugin {
    private let PLUGIN_VERSION: String = "7.2.0"
    public let identifier = "AdmobPlusPlugin"
    public let jsName = "AdMobPlus"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPluginVersion", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = AdmobPlus()

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve([
            "value": implementation.echo(value)
        ])
    }

    @objc func getPluginVersion(_ call: CAPPluginCall) {
        call.resolve(["version": self.PLUGIN_VERSION])
    }

}
