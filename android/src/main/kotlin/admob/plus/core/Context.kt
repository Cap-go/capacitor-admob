package admob.plus.core

import android.os.Bundle
import com.google.android.libraries.ads.mobile.sdk.MobileAds
import com.google.android.libraries.ads.mobile.sdk.banner.AdSize
import com.google.android.libraries.ads.mobile.sdk.banner.BannerAdRequest
import com.google.android.libraries.ads.mobile.sdk.common.AdRequest
import com.google.android.libraries.ads.mobile.sdk.common.LoadAdError
import com.google.android.libraries.ads.mobile.sdk.common.RequestConfiguration
import com.google.android.libraries.ads.mobile.sdk.rewarded.ServerSideVerificationOptions
import org.json.JSONObject

interface Context {
    fun has(name: String): Boolean
    fun opt(name: String): Any?
    fun optBoolean(name: String): Boolean?
    fun optDouble(name: String): Double?
    fun optDouble(name: String, defaultValue: Double): Double {
        return optDouble(name) ?: return defaultValue
    }

    fun optFloat(name: String): Float? {
        val v = optDouble(name) ?: return null
        return v.toFloat()
    }

    fun optInt(name: String): Int?
    fun optString(name: String): String?
    fun optStringList(name: String): List<String>
    fun optObject(name: String): JSONObject?
    fun resolve()
    fun resolve(data: Boolean)
    fun reject(msg: String?)
    fun reject() {
        reject("unknown error")
    }

    fun reject(loadAdError: LoadAdError) {
        reject(loadAdError.message)
    }

    fun optId(): Int? {
        return optInt("id")
    }

    fun optAd(): Ad? {
        return Helper.getAd(optId())
    }

    fun optAdOrError(): Ad? {
        val ad = optAd()
        if (ad == null) {
            this.reject("Ad not found")
        }
        return ad
    }

    fun optAdUnitID(): String? {
        return optString("adUnitId")
    }

    fun optAppMuted(): Boolean? {
        return optBoolean("appMuted")
    }

    fun optAppVolume(): Float? {
        return optFloat("appVolume")
    }

    fun optPosition(): String? {
        return optString("position")
    }

    fun optAdRequest(adUnitId: String): AdRequest {
        val builder = AdRequest.Builder(adUnitId)
        optString("contentUrl")?.let(builder::setContentUrl)
        val extras = Bundle()
        if (has("npa")) {
            extras.putString("npa", optString("npa"))
        }
        if (!extras.isEmpty) {
            builder.setGoogleExtrasBundle(extras)
        }
        return builder.build()
    }

    fun optBannerAdRequest(adUnitId: String, adSize: AdSize, collapsibleAnchor: String? = null): BannerAdRequest {
        val builder = BannerAdRequest.Builder(adUnitId, adSize)
        optString("contentUrl")?.let(builder::setContentUrl)
        val extras = Bundle()
        if (has("npa")) {
            extras.putString("npa", optString("npa"))
        }
        if (collapsibleAnchor != null) {
            extras.putString("collapsible", collapsibleAnchor)
        }
        if (!extras.isEmpty) {
            builder.setGoogleExtrasBundle(extras)
        }
        return builder.build()
    }

    fun optRequestConfiguration(): RequestConfiguration {
        val builder = RequestConfiguration.Builder()
        optMaxAdContentRating()?.let(builder::setMaxAdContentRating)
        val tagForChildDirectedTreatment = tagForChildDirectedTreatmentFromBool(this, "tagForChildDirectedTreatment")
        if (tagForChildDirectedTreatment != null) {
            builder.setTagForChildDirectedTreatment(tagForChildDirectedTreatment)
        }
        val tagForUnderAgeOfConsent = tagForUnderAgeOfConsentFromBool(this, "tagForUnderAgeOfConsent")
        if (tagForUnderAgeOfConsent != null) {
            builder.setTagForUnderAgeOfConsent(tagForUnderAgeOfConsent)
        }
        if (has("testDeviceIds")) {
            builder.setTestDeviceIds(optStringList("testDeviceIds"))
        }
        return builder.build()
    }

    fun optServerSideVerificationOptions(): ServerSideVerificationOptions? {
        val param = "serverSideVerification"
        val serverSideVerification = optObject(param) ?: return null
        val customData = if (serverSideVerification.has("customData")) {
            serverSideVerification.optString("customData").ifBlank { null }
        } else {
            null
        }
        val userId = if (serverSideVerification.has("userId")) {
            serverSideVerification.optString("userId").ifBlank { null }
        } else {
            null
        }
        if (customData == null && userId == null) {
            return null
        }
        return ServerSideVerificationOptions(userId ?: "", customData ?: "")
    }

    fun configure(helper: Helper) {
        val appMuted = optAppMuted()
        if (appMuted != null) {
            MobileAds.setUserMutedApp(appMuted)
        }
        val appVolume = optAppVolume()
        if (appVolume != null) {
            MobileAds.setUserControlledAppVolume(appVolume)
        }
        MobileAds.setRequestConfiguration(optRequestConfiguration())
        helper.configForTestLab()
        resolve()
    }

    companion object {
        private fun tagForChildDirectedTreatmentFromBool(
            ctx: Context,
            name: String,
        ): RequestConfiguration.TagForChildDirectedTreatment? {
            if (!ctx.has(name)) return null
            val v = ctx.optBoolean(name)
            return when (v) {
                true -> RequestConfiguration.TagForChildDirectedTreatment.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE
                false -> RequestConfiguration.TagForChildDirectedTreatment.TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE
                null -> RequestConfiguration.TagForChildDirectedTreatment.TAG_FOR_CHILD_DIRECTED_TREATMENT_UNSPECIFIED
            }
        }

        private fun tagForUnderAgeOfConsentFromBool(
            ctx: Context,
            name: String,
        ): RequestConfiguration.TagForUnderAgeOfConsent? {
            if (!ctx.has(name)) return null
            val v = ctx.optBoolean(name)
            return when (v) {
                true -> RequestConfiguration.TagForUnderAgeOfConsent.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE
                false -> RequestConfiguration.TagForUnderAgeOfConsent.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE
                null -> RequestConfiguration.TagForUnderAgeOfConsent.TAG_FOR_UNDER_AGE_OF_CONSENT_UNSPECIFIED
            }
        }
    }

    private fun optMaxAdContentRating(): RequestConfiguration.MaxAdContentRating? {
        if (!has("maxAdContentRating")) {
            return null
        }
        return when (optString("maxAdContentRating")) {
            "G" -> RequestConfiguration.MaxAdContentRating.MAX_AD_CONTENT_RATING_G
            "PG" -> RequestConfiguration.MaxAdContentRating.MAX_AD_CONTENT_RATING_PG
            "T" -> RequestConfiguration.MaxAdContentRating.MAX_AD_CONTENT_RATING_T
            "MA" -> RequestConfiguration.MaxAdContentRating.MAX_AD_CONTENT_RATING_MA
            else -> RequestConfiguration.MaxAdContentRating.MAX_AD_CONTENT_RATING_UNSPECIFIED
        }
    }
}
