package admob.plus.capacitor

import admob.plus.capacitor.ads.Banner
import admob.plus.capacitor.feed.FeedAdManager
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
import com.google.android.libraries.ads.mobile.sdk.common.RequestConfiguration
import com.google.android.libraries.ads.mobile.sdk.initialization.InitializationConfig
import org.json.JSONException
import org.json.JSONObject

@CapacitorPlugin(name = "AdMobPlus")
class AdMobPlusPlugin : Plugin(), Helper.Adapter {
    private val pluginVersion = "8.0.15"
    private var helper: Helper? = null
    private var consentHelper: ConsentHelper? = null
    private var feedAdManager: FeedAdManager? = null
    @Volatile
    private var mobileAdsInitialized = false
    private var requestConfigurationOverride: RequestConfiguration? = null

    override fun load() {
        super.load()
        helper = Helper(this)
        consentHelper = ConsentHelper(this)
        feedAdManager = FeedAdManager(this)
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

        val initializationConfigBuilder = InitializationConfig.Builder(appId)
        requestConfigurationOverride?.let(initializationConfigBuilder::setRequestConfiguration)

        MobileAds.initialize(context, initializationConfigBuilder.build()) {
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
    fun requestConsentInfo(call: PluginCall) {
        bridge.executeOnMainThread {
            consentHelper?.requestConsentInfo(call)
        }
    }

    @PluginMethod
    fun showConsentForm(call: PluginCall) {
        consentHelper?.showConsentForm(call)
    }

    @PluginMethod
    fun showPrivacyOptionsForm(call: PluginCall) {
        consentHelper?.showPrivacyOptionsForm(call)
    }

    @PluginMethod
    fun configRequest(call: PluginCall) {
        val ctx = ExecuteContext(call)
        val requestConfiguration = ctx.optRequestConfiguration()
        requestConfigurationOverride = requestConfiguration
        if (mobileAdsInitialized) {
            MobileAds.setRequestConfiguration(requestConfiguration)
            helper!!.configForTestLab()
        }
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
    fun feedAdCreate(call: PluginCall) {
        val format = call.getString("format")
        val adUnitId = call.getString("adUnitId")
        if (format == null || adUnitId == null) {
            call.reject("format and adUnitId are required")
            return
        }
        val positionKey = call.getString("positionKey")
        val autoRefreshMs = if (call.data.has("autoRefreshMs") && !call.data.isNull("autoRefreshMs")) {
            call.getInt("autoRefreshMs")
        } else {
            null
        }
        val nativeStyle = mutableMapOf<String, String>()
        val styleObj = call.getObject("nativeStyle")
        if (styleObj != null) {
            val keys = styleObj.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                nativeStyle[key] = styleObj.optString(key)
            }
        }
        bridge.executeOnMainThread {
            val id = feedAdManager!!.create(format, adUnitId, positionKey, autoRefreshMs, nativeStyle)
            val ret = JSObject()
            ret.put("id", id)
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun feedAdDestroy(call: PluginCall) {
        val id = call.getInt("id")
        if (id == null) {
            call.reject("id is required")
            return
        }
        bridge.executeOnMainThread {
            feedAdManager!!.destroy(id)
            call.resolve()
        }
    }

    @PluginMethod
    fun feedAdLoad(call: PluginCall) {
        val id = call.getInt("id")
        if (id == null) {
            call.reject("id is required")
            return
        }
        if (rejectIfNotInitialized { call.reject(it) }) {
            return
        }
        feedAdManager!!.load(id) { error ->
            if (error != null) {
                call.reject(error)
            } else {
                call.resolve()
            }
        }
    }

    @PluginMethod
    fun feedAdIsLoaded(call: PluginCall) {
        val id = call.getInt("id")
        if (id == null) {
            call.reject("id is required")
            return
        }
        val ret = JSObject()
        ret.put("value", feedAdManager!!.isLoaded(id))
        call.resolve(ret)
    }

    @PluginMethod
    fun feedAdUpdateBounds(call: PluginCall) {
        val id = call.getInt("id")
        if (id == null) {
            call.reject("id is required")
            return
        }
        val x = call.getDouble("x") ?: 0.0
        val y = call.getDouble("y") ?: 0.0
        val width = call.getDouble("width") ?: 0.0
        val height = call.getDouble("height") ?: 0.0
        val visible = call.getBoolean("visible") ?: false
        feedAdManager!!.updateBounds(id, x, y, width, height, visible)
        call.resolve()
    }

    @PluginMethod
    fun feedAdSetAutoRefresh(call: PluginCall) {
        val id = call.getInt("id")
        if (id == null) {
            call.reject("id is required")
            return
        }
        val autoRefreshMs = if (call.data.has("autoRefreshMs") && !call.data.isNull("autoRefreshMs")) {
            call.getInt("autoRefreshMs")
        } else {
            null
        }
        feedAdManager!!.setAutoRefresh(id, autoRefreshMs)
        call.resolve()
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
