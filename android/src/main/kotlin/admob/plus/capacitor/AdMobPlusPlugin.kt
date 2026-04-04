package admob.plus.capacitor

import admob.plus.capacitor.ads.Banner
import admob.plus.capacitor.ads.Interstitial
import admob.plus.capacitor.ads.Rewarded
import admob.plus.capacitor.ads.RewardedInterstitial
import admob.plus.core.GenericAd
import admob.plus.core.Helper
import android.app.Activity
import android.content.pm.PackageManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.libraries.ads.mobile.sdk.MobileAds
import com.google.android.libraries.ads.mobile.sdk.initialization.InitializationConfig
import org.json.JSONException
import org.json.JSONObject

@CapacitorPlugin(name = "AdMobPlus")
class AdMobPlusPlugin : Plugin(), Helper.Adapter {
    private val pluginVersion = "8.0.15"
    private var helper: Helper? = null
    @Volatile
    private var mobileAdsInitialized = false

    override fun load() {
        super.load()
        helper = Helper(this)
        ExecuteContext.plugin = this
    }

    @PluginMethod
    fun trackingAuthorizationStatus(call: PluginCall) {
        try {
            call.resolve(JSObject("{\"status\": false}"))
        } catch (ex: JSONException) {
            call.reject(ex.toString())
        }
    }

    @PluginMethod
    fun requestTrackingAuthorization(call: PluginCall) {
        try {
            call.resolve(JSObject("{\"status\": false}"))
        } catch (ex: JSONException) {
            call.reject(ex.toString())
        }
    }

    @PluginMethod
    fun start(call: PluginCall) {
        if (mobileAdsInitialized) {
            call.resolve()
            return
        }

        val appId = getAppIdFromManifest()
        if (appId == null) {
            call.reject("AdMob App ID missing")
            return
        }

        val initializationConfig = InitializationConfig.Builder(appId)
            .setRequestConfiguration(MobileAds.getRequestConfiguration())
            .build()

        MobileAds.initialize(context, initializationConfig) {
            mobileAdsInitialized = true
            helper!!.configForTestLab()
            call.resolve()
        }
    }

    @PluginMethod
    fun configure(call: PluginCall) {
        val ctx = ExecuteContext(call)
        if (rejectIfNotInitialized { ctx.reject(it) }) {
            return
        }
        ctx.configure(helper!!)
    }

    @PluginMethod
    fun configRequest(call: PluginCall) {
        val ctx = ExecuteContext(call)
        if (rejectIfNotInitialized { ctx.reject(it) }) {
            return
        }
        MobileAds.setRequestConfiguration(ctx.optRequestConfiguration())
        helper!!.configForTestLab()
        ctx.resolve()
    }

    @PluginMethod
    fun adCreate(call: PluginCall) {
        val ctx = ExecuteContext(call)
        bridge.executeOnMainThread {
            val adClass = ctx.optString("cls")
            if (adClass == null) {
                ctx.reject("ad cls is missing")
            } else {
                val created = when (adClass) {
                    "BannerAd" -> Banner(ctx)
                    "InterstitialAd" -> Interstitial(ctx)
                    "RewardedAd" -> Rewarded(ctx)
                    "RewardedInterstitialAd" -> RewardedInterstitial(ctx)
                    else -> null
                }
                if (created == null) {
                    ctx.reject("ad cls is not supported: $adClass")
                } else {
                    ctx.resolve()
                }
            }
        }
    }

    @PluginMethod
    fun adIsLoaded(call: PluginCall) {
        val ctx = ExecuteContext(call)
        bridge.executeOnMainThread {
            val ad = ctx.optAdOrError() as GenericAd?
            if (ad != null) {
                ctx.resolve(ad.isLoaded)
            }
        }
    }

    @PluginMethod
    fun adLoad(call: PluginCall) {
        val ctx = ExecuteContext(call)
        if (rejectIfNotInitialized { ctx.reject(it) }) {
            return
        }
        bridge.executeOnMainThread {
            val ad = ctx.optAdOrError() as GenericAd?
            ad?.load(ctx)
        }
    }

    @PluginMethod
    fun adShow(call: PluginCall) {
        val ctx = ExecuteContext(call)
        if (rejectIfNotInitialized { ctx.reject(it) }) {
            return
        }
        bridge.executeOnMainThread {
            val ad = ctx.optAdOrError() as GenericAd?
            if (ad != null) {
                if (ad.isLoaded) {
                    ad.show(ctx)
                } else {
                    ctx.reject("ad is not loaded")
                }
            }
        }
    }

    @PluginMethod
    fun adHide(call: PluginCall) {
        val ctx = ExecuteContext(call)
        bridge.executeOnMainThread {
            val ad = ctx.optAdOrError() as GenericAd?
            ad?.hide(ctx)
        }
    }

    fun emit(eventName: String?, data: JSObject?) {
        notifyListeners(eventName, data)
    }

    override val activity: Activity
        get() = getActivity()

    override fun emit(eventName: String?, data: Map<String?, Any?>?) {
        val payload = JSObject()
        data?.forEach { (key, value) ->
            if (key != null) {
                payload.put(key, value)
            }
        }
        emit(eventName, payload)
    }

    @PluginMethod
    fun getPluginVersion(call: PluginCall) {
        try {
            val ret = JSObject()
            ret.put("version", pluginVersion)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Could not get plugin version", e)
        }
    }

    private fun getAppIdFromManifest(): String? {
        return try {
            val appContext = context.applicationContext
            val applicationInfo = appContext.packageManager.getApplicationInfo(
                appContext.packageName,
                PackageManager.GET_META_DATA
            )
            val metaData = applicationInfo.metaData ?: return null
            metaData.getString(ADMOB_APP_ID_KEY)?.takeIf { it.isNotBlank() }
                ?: metaData.getInt(ADMOB_APP_ID_KEY).takeIf { it != 0 }?.let(appContext::getString)
        } catch (_: Exception) {
            null
        }
    }

    private fun rejectIfNotInitialized(reject: (String) -> Unit): Boolean {
        if (mobileAdsInitialized) {
            return false
        }
        reject("AdMob is not initialized. Call start() and wait for it to resolve.")
        return true
    }

    private companion object {
        private const val ADMOB_APP_ID_KEY = "com.google.android.gms.ads.APPLICATION_ID"
    }
}
