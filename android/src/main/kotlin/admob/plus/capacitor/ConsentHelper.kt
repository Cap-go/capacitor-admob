package admob.plus.capacitor

import android.app.Activity
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.PluginCall
import com.google.android.ump.ConsentDebugSettings
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform

class ConsentHelper(private val plugin: AdMobPlusPlugin) {
    private var consentInformation: ConsentInformation? = null

    fun requestConsentInfo(call: PluginCall) {
        try {
            val consentInfo = ensureConsentInfo()
            val activity = plugin.activity
            if (activity == null) {
                call.reject("Trying to request consent info but the Activity is null")
                return
            }

            val debugSettingsBuilder = ConsentDebugSettings.Builder(plugin.context)
            val data = call.data

            if (data.has("testDeviceIdentifiers")) {
                val devices = call.getArray("testDeviceIdentifiers") ?: JSArray()
                for (i in 0 until devices.length()) {
                    debugSettingsBuilder.addTestDeviceHashedId(devices.getString(i))
                }
            }

            if (data.has("debugGeography")) {
                debugSettingsBuilder.setDebugGeography(data.getInt("debugGeography"))
            }

            val paramsBuilder = ConsentRequestParameters.Builder()
                .setConsentDebugSettings(debugSettingsBuilder.build())

            if (data.has("tagForUnderAgeOfConsent")) {
                paramsBuilder.setTagForUnderAgeOfConsent(data.getBoolean("tagForUnderAgeOfConsent"))
            }

            consentInfo.requestConsentInfoUpdate(
                activity,
                paramsBuilder.build(),
                {
                    call.resolve(buildConsentInfo(consentInfo))
                },
                { formError ->
                    call.reject(formError.message)
                },
            )
        } catch (ex: Exception) {
            call.reject(ex.localizedMessage, ex)
        }
    }

    fun showPrivacyOptionsForm(call: PluginCall) {
        try {
            val activity = plugin.activity
            if (activity == null) {
                call.reject("Trying to show the privacy options form but the Activity is null")
                return
            }

            ensureConsentInfo()
            activity.runOnUiThread {
                UserMessagingPlatform.showPrivacyOptionsForm(activity) { formError ->
                    if (formError != null) {
                        call.reject("Error when show privacy form", formError.message)
                    } else {
                        call.resolve()
                    }
                }
            }
        } catch (ex: Exception) {
            call.reject(ex.localizedMessage, ex)
        }
    }

    fun showConsentForm(call: PluginCall) {
        try {
            val activity = plugin.activity
            if (activity == null) {
                call.reject("Trying to show the consent form but the Activity is null")
                return
            }

            val consentInfo = ensureConsentInfo()
            activity.runOnUiThread {
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { formError ->
                    if (formError != null) {
                        call.reject("Error when show consent form", formError.message)
                        return@loadAndShowConsentFormIfRequired
                    }

                    call.resolve(buildConsentInfo(consentInfo, includeFormAvailability = false))
                }
            }
        } catch (ex: Exception) {
            call.reject(ex.localizedMessage, ex)
        }
    }

    private fun ensureConsentInfo(): ConsentInformation {
        if (consentInformation == null) {
            consentInformation = UserMessagingPlatform.getConsentInformation(plugin.context)
        }
        return consentInformation!!
    }

    private fun buildConsentInfo(
        consentInfo: ConsentInformation,
        includeFormAvailability: Boolean = true,
    ): JSObject {
        val result = JSObject()
        result.put("status", getConsentStatusString(consentInfo.consentStatus))
        if (includeFormAvailability) {
            result.put("isConsentFormAvailable", consentInfo.isConsentFormAvailable)
        }
        result.put("canRequestAds", consentInfo.canRequestAds())
        result.put(
            "privacyOptionsRequirementStatus",
            consentInfo.privacyOptionsRequirementStatus.name,
        )
        return result
    }

    private fun getConsentStatusString(consentStatus: Int): String {
        return when (consentStatus) {
            ConsentInformation.ConsentStatus.REQUIRED -> "REQUIRED"
            ConsentInformation.ConsentStatus.NOT_REQUIRED -> "NOT_REQUIRED"
            ConsentInformation.ConsentStatus.OBTAINED -> "OBTAINED"
            ConsentInformation.ConsentStatus.UNKNOWN -> "UNKNOWN"
            else -> "UNKNOWN"
        }
    }
}
