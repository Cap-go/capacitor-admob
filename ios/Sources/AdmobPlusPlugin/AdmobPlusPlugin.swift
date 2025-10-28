import Capacitor
import Foundation

@objc(AdmobPlusPlugin)
public class AdmobPlusPlugin: CAPPlugin, CAPBridgedPlugin {
    private let PLUGIN_VERSION: String = "7.3.3"
    public let identifier = "AdmobPlusPlugin"
    public let jsName = "AdMobPlus"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getPluginVersion", returnType: CAPPluginReturnPromise)
    ]

    @objc func getPluginVersion(_ call: CAPPluginCall) {
        call.resolve(["version": self.PLUGIN_VERSION])
    }

}
