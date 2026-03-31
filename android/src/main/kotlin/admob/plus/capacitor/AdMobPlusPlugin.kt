package admob.plus.capacitor

import admob.plus.capacitor.ads.Banner
import admob.plus.capacitor.ads.Interstitial
import admob.plus.capacitor.ads.Rewarded
import admob.plus.capacitor.ads.RewardedInterstitial
import admob.plus.core.GenericAd
import admob.plus.core.Helper
import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.WindowInsets
import android.view.WindowInsetsController
import androidx.annotation.RequiresApi
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

    override fun load() {
        super.load()
        helper = Helper(this)
        ExecuteContext.plugin = this
        applyAdMobApi35WorkaroundIfNeeded(activity.application)
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
        val appId = getAppIdFromManifest()
        if (appId == null) {
            call.reject("AdMob App ID missing")
            return
        }

        val initializationConfig = InitializationConfig.Builder(appId)
            .setRequestConfiguration(MobileAds.getRequestConfiguration())
            .build()

        MobileAds.initialize(context, initializationConfig) {
            helper!!.configForTestLab()
            call.resolve()
        }
    }

    @PluginMethod
    fun configure(call: PluginCall) {
        val ctx = ExecuteContext(call)
        ctx.configure(helper!!)
    }

    @PluginMethod
    fun configRequest(call: PluginCall) {
        val ctx = ExecuteContext(call)
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
        bridge.executeOnMainThread {
            val ad = ctx.optAdOrError() as GenericAd?
            ad?.load(ctx)
        }
    }

    @PluginMethod
    fun adShow(call: PluginCall) {
        val ctx = ExecuteContext(call)
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
            val appContext: Context = context.applicationContext
            val applicationInfo = appContext.packageManager.getApplicationInfo(
                appContext.packageName,
                PackageManager.GET_META_DATA
            )
            applicationInfo.metaData?.getString("com.google.android.gms.ads.APPLICATION_ID")
        } catch (_: Exception) {
            null
        }
    }

    private fun applyAdMobApi35WorkaroundIfNeeded(application: Application) {
        if (Build.VERSION.SDK_INT < 35) {
            return
        }

        application.registerActivityLifecycleCallbacks(object : Application.ActivityLifecycleCallbacks {
            override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = Unit

            override fun onActivityStarted(activity: Activity) {
                applyApi35WorkaroundToActivity(activity)
            }

            override fun onActivityResumed(activity: Activity) {
                applyApi35WorkaroundToActivity(activity)
            }

            override fun onActivityPaused(activity: Activity) = Unit

            override fun onActivityStopped(activity: Activity) = Unit

            override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit

            override fun onActivityDestroyed(activity: Activity) = Unit
        })
    }

    @RequiresApi(Build.VERSION_CODES.S)
    private fun applyApi35WorkaroundToActivity(activity: Activity) {
        if (activity.javaClass.name != "com.google.android.gms.ads.AdActivity") {
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            activity.window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.systemBars())
                controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_DEFAULT
            }
        }
    }
}
