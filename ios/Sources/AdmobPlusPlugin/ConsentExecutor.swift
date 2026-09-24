import Foundation
import Capacitor
import GoogleMobileAds
import UserMessagingPlatform

class ConsentExecutor: NSObject {
    weak var plugin: AdmobPlusPlugin?

    func requestConsentInfo(_ call: CAPPluginCall, debugGeography: Int, testDeviceIdentifiers: [String], tagForUnderAgeOfConsent: Bool) {
        let parameters = RequestParameters()
        let debugSettings = DebugSettings()

        debugSettings.geography = DebugGeography(rawValue: debugGeography) ?? DebugGeography.disabled
        debugSettings.testDeviceIdentifiers = testDeviceIdentifiers

        parameters.debugSettings = debugSettings
        parameters.isTaggedForUnderAgeOfConsent = tagForUnderAgeOfConsent

        ConsentInformation.shared.requestConsentInfoUpdate(with: parameters) { error in
            if let error = error {
                call.reject(error.localizedDescription)
            } else {
                call.resolve(self.buildConsentInfo(includeFormAvailability: true))
            }
        }
    }

    @MainActor
    func showPrivacyOptionsForm(_ call: CAPPluginCall) {
        guard let rootViewController = plugin?.bridge?.viewController else {
            call.reject("No ViewController")
            return
        }

        Task {
            do {
                try await ConsentForm.presentPrivacyOptionsForm(from: rootViewController)
                call.resolve()
            } catch {
                call.reject("Failed to show privacy options form: \(error.localizedDescription)")
            }
        }
    }

    func showConsentForm(_ call: CAPPluginCall) {
        guard let rootViewController = plugin?.bridge?.viewController else {
            call.reject("No ViewController")
            return
        }

        let formStatus = ConsentInformation.shared.formStatus
        if formStatus != FormStatus.available {
            call.reject("Consent Form not available")
            return
        }

        Task { @MainActor in
            do {
                try await ConsentForm.loadAndPresentIfRequired(from: rootViewController)
                call.resolve(self.buildConsentInfo(includeFormAvailability: false))
            } catch {
                call.reject("Error when show consent form: \(error.localizedDescription)")
            }
        }
    }

    private func buildConsentInfo(includeFormAvailability: Bool) -> [String: Any] {
        var result: [String: Any] = [
            "status": getConsentStatusString(ConsentInformation.shared.consentStatus),
            "canRequestAds": ConsentInformation.shared.canRequestAds,
            "privacyOptionsRequirementStatus": getPrivacyOptionsRequirementStatus(
                ConsentInformation.shared.privacyOptionsRequirementStatus
            ),
        ]

        if includeFormAvailability {
            result["isConsentFormAvailable"] = ConsentInformation.shared.formStatus == FormStatus.available
        }

        return result
    }

    private func getConsentStatusString(_ consentStatus: ConsentStatus) -> String {
        switch consentStatus {
        case ConsentStatus.required:
            return "REQUIRED"
        case ConsentStatus.notRequired:
            return "NOT_REQUIRED"
        case ConsentStatus.obtained:
            return "OBTAINED"
        default:
            return "UNKNOWN"
        }
    }

    private func getPrivacyOptionsRequirementStatus(_ requirementStatus: PrivacyOptionsRequirementStatus) -> String {
        switch requirementStatus {
        case PrivacyOptionsRequirementStatus.required:
            return "REQUIRED"
        case PrivacyOptionsRequirementStatus.notRequired:
            return "NOT_REQUIRED"
        default:
            return "UNKNOWN"
        }
    }
}
