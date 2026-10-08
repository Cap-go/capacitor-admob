package admob.plus.capacitor.feed

import admob.plus.capacitor.AdMobPlusPlugin
import admob.plus.capacitor.Generated
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import com.getcapacitor.JSObject
import com.google.android.libraries.ads.mobile.sdk.banner.AdSize
import com.google.android.libraries.ads.mobile.sdk.banner.AdView
import com.google.android.libraries.ads.mobile.sdk.banner.BannerAd
import com.google.android.libraries.ads.mobile.sdk.banner.BannerAdEventCallback
import com.google.android.libraries.ads.mobile.sdk.common.AdLoadCallback
import com.google.android.libraries.ads.mobile.sdk.common.LoadAdError
import com.google.android.libraries.ads.mobile.sdk.nativead.MediaView
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAd
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAdLoader
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAdLoaderCallback
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAdRequest
import com.google.android.libraries.ads.mobile.sdk.nativead.NativeAdView
import kotlin.math.max

private const val MIN_AUTO_REFRESH_MS = 30_000L

class FeedAdManager(private val plugin: AdMobPlusPlugin) {
    private val entries = mutableMapOf<Int, FeedAdEntry>()
    private var nextId = 1
    private val mainHandler = Handler(Looper.getMainLooper())

    fun create(
        format: String,
        adUnitId: String,
        positionKey: String?,
        autoRefreshMs: Int?,
        nativeStyle: Map<String, String>,
    ): Int {
        val id = nextId++
        val entry = FeedAdEntry(
            id = id,
            format = if (format == "banner") FeedAdFormat.BANNER else FeedAdFormat.NATIVE,
            adUnitId = adUnitId,
            positionKey = positionKey,
            nativeStyle = nativeStyle,
            plugin = plugin,
            mainHandler = mainHandler,
        )
        autoRefreshMs?.let { entry.setAutoRefresh(it) }
        entries[id] = entry
        return id
    }

    fun destroy(id: Int) {
        entries.remove(id)?.destroy()
    }

    fun load(id: Int, onComplete: (String?) -> Unit) {
        val entry = entries[id]
        if (entry == null) {
            onComplete("Feed ad not found")
            return
        }
        entry.load(onComplete)
    }

    fun isLoaded(id: Int): Boolean = entries[id]?.isLoaded == true

    fun updateBounds(
        id: Int,
        x: Double,
        y: Double,
        width: Double,
        height: Double,
        visible: Boolean,
    ) {
        entries[id]?.updateBounds(x, y, width, height, visible)
    }

    fun setAutoRefresh(id: Int, autoRefreshMs: Int?) {
        entries[id]?.setAutoRefresh(autoRefreshMs)
    }
}

private enum class FeedAdFormat {
    NATIVE,
    BANNER,
}

private class FeedAdEntry(
    val id: Int,
    val format: FeedAdFormat,
    val adUnitId: String,
    val positionKey: String?,
    val nativeStyle: Map<String, String>,
    private val plugin: AdMobPlusPlugin,
    private val mainHandler: Handler,
) {
    private var adHost: View? = null
    private var nativeAd: NativeAd? = null
    private var bannerAdView: AdView? = null
    private var loaded = false
    private var refreshRunnable: Runnable? = null
    private var loadCallback: ((String?) -> Unit)? = null

    val isLoaded: Boolean
        get() = loaded

    fun destroy() {
        refreshRunnable?.let { mainHandler.removeCallbacks(it) }
        refreshRunnable = null
        nativeAd?.destroy()
        nativeAd = null
        adHost?.let { (it.parent as? ViewGroup)?.removeView(it) }
        adHost = null
        bannerAdView?.destroy()
        bannerAdView = null
        loaded = false
    }

    fun setAutoRefresh(autoRefreshMs: Int?) {
        refreshRunnable?.let { mainHandler.removeCallbacks(it) }
        refreshRunnable = null
        if (autoRefreshMs == null || autoRefreshMs < MIN_AUTO_REFRESH_MS) {
            return
        }
        val runnable = object : Runnable {
            override fun run() {
                emitFeed(Generated.Events.FEED_REFRESH, null)
                load { }
                mainHandler.postDelayed(this, autoRefreshMs.toLong())
            }
        }
        refreshRunnable = runnable
        mainHandler.postDelayed(runnable, autoRefreshMs.toLong())
    }

    fun load(onComplete: (String?) -> Unit) {
        loadCallback = onComplete
        mainHandler.post {
            when (format) {
                FeedAdFormat.NATIVE -> loadNative()
                FeedAdFormat.BANNER -> loadBanner()
            }
        }
    }

    fun updateBounds(x: Double, y: Double, width: Double, height: Double, visible: Boolean) {
        mainHandler.post {
            val webView = plugin.bridge.webView
            val host = adHost ?: return@post
            val parent = webView.parent as? ViewGroup ?: return@post
            if (host.parent == null) {
                parent.addView(host)
            }
            val density = webView.resources.displayMetrics.density
            val left = (x * density).toInt()
            val top = (y * density).toInt() + webView.top
            val w = max(1, (width * density).toInt())
            val h = max(1, (height * density).toInt())
            val params = FrameLayout.LayoutParams(w, h).apply {
                leftMargin = left
                topMargin = top
            }
            host.layoutParams = params
            host.visibility = if (visible && loaded) View.VISIBLE else View.INVISIBLE
            host.bringToFront()
        }
    }

    private fun finishLoad(errorMessage: String?) {
        val cb = loadCallback
        loadCallback = null
        cb?.invoke(errorMessage)
    }

    private fun loadNative() {
        val request = NativeAdRequest.Builder(adUnitId, listOf(NativeAd.NativeAdType.NATIVE)).build()
        NativeAdLoader.load(
            request,
            object : NativeAdLoaderCallback {
                override fun onNativeAdLoaded(ad: NativeAd) {
                    mainHandler.post {
                        displayNativeAd(ad)
                    }
                }

                override fun onAdFailedToLoad(adError: LoadAdError) {
                    emitFeedFail(adError)
                    loaded = false
                    finishLoad(adError.message)
                }
            },
        )
    }

    private fun displayNativeAd(ad: NativeAd) {
        val oldHost = adHost
        val oldParent = oldHost?.parent as? ViewGroup
        oldParent?.removeView(oldHost)
        nativeAd?.destroy()
        nativeAd = ad
        val nativeAdView = buildNativeAdView(ad)
        adHost = nativeAdView
        oldHost?.layoutParams?.let { nativeAdView.layoutParams = it }
        oldParent?.addView(nativeAdView)
        loaded = true
        nativeAdView.visibility = View.VISIBLE

        val assets = JSObject()
        assets.put("headline", ad.headline ?: "")
        assets.put("body", ad.body ?: "")
        assets.put("callToAction", ad.callToAction ?: "")
        assets.put("advertiser", ad.advertiser ?: "")
        assets.put("price", ad.price ?: "")
        assets.put("store", ad.store ?: "")
        ad.starRating?.let { assets.put("starRating", it) }
        ad.mediaContent?.aspectRatio?.let { assets.put("mediaAspectRatio", it) }
        emitFeed(Generated.Events.FEED_LOAD, assets)
        finishLoad(null)
    }

    private fun buildNativeAdView(ad: NativeAd): NativeAdView {
        val context = plugin.context
        val nativeAdView = NativeAdView(context)
        nativeAdView.setBackgroundColor(parseColor(nativeStyle["backgroundColor"]) ?: Color.parseColor("#F2F2F2"))

        val column = LinearLayout(context)
        column.orientation = LinearLayout.VERTICAL
        column.setPadding(24, 24, 24, 24)

        val attribution = TextView(context)
        attribution.text = "Ad"
        attribution.gravity = Gravity.END
        attribution.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
        column.addView(attribution)

        val mediaView = MediaView(context)
        mediaView.layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            (180 * context.resources.displayMetrics.density).toInt(),
        )
        column.addView(mediaView)

        val headline = TextView(context)
        headline.text = ad.headline
        headline.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
        headline.setTextColor(parseColor(nativeStyle["headlineTextColor"]) ?: Color.BLACK)
        nativeAdView.headlineView = headline
        column.addView(headline)

        if (!ad.body.isNullOrBlank()) {
            val body = TextView(context)
            body.text = ad.body
            body.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            body.setTextColor(parseColor(nativeStyle["bodyTextColor"]) ?: Color.DKGRAY)
            nativeAdView.bodyView = body
            column.addView(body)
        }

        val cta = Button(context)
        cta.text = ad.callToAction
        cta.isClickable = false
        cta.isEnabled = false
        cta.setBackgroundColor(parseColor(nativeStyle["ctaBackgroundColor"]) ?: Color.parseColor("#2563EB"))
        cta.setTextColor(parseColor(nativeStyle["ctaTextColor"]) ?: Color.WHITE)
        nativeAdView.callToActionView = cta
        column.addView(cta)

        nativeAdView.addView(
            column,
            ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            ),
        )
        nativeAdView.registerNativeAd(ad, mediaView)
        return nativeAdView
    }

    private fun loadBanner() {
        val activity = plugin.activity
        val webView = plugin.bridge.webView
        if (bannerAdView == null) {
            bannerAdView = AdView(activity)
            adHost = bannerAdView
        }
        loaded = false
        val adWidth = (webView.width / webView.resources.displayMetrics.density).toInt().coerceAtLeast(320)
        val adSize = AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(activity, adWidth)
        bannerAdView!!.loadAd(
            com.google.android.libraries.ads.mobile.sdk.banner.BannerAdRequest.Builder(adUnitId, adSize).build(),
            object : AdLoadCallback<BannerAd> {
                override fun onAdLoaded(bannerAd: BannerAd) {
                    loaded = true
                    bannerAd.adEventCallback = object : BannerAdEventCallback {
                        override fun onAdClicked() {
                            emitFeed(Generated.Events.FEED_CLICK, null)
                        }

                        override fun onAdDismissedFullScreenContent() {
                            emitFeed(Generated.Events.FEED_CLOSE, null)
                        }

                        override fun onAdImpression() {
                            emitFeed(Generated.Events.FEED_IMPRESSION, null)
                        }

                        override fun onAdShowedFullScreenContent() {
                            emitFeed(Generated.Events.FEED_OPEN, null)
                        }
                    }
                    val assets = JSObject()
                    assets.put("width", adSize.width)
                    assets.put("height", adSize.height)
                    emitFeed(Generated.Events.FEED_LOAD, assets)
                    finishLoad(null)
                }

                override fun onAdFailedToLoad(loadAdError: LoadAdError) {
                    emitFeedFail(loadAdError)
                    loaded = false
                    finishLoad(loadAdError.message)
                }
            },
        )
    }

    private fun emitFeed(event: String, assets: JSObject?) {
        val payload = JSObject()
        payload.put("feedAdId", id)
        positionKey?.let { payload.put("positionKey", it) }
        payload.put("format", if (format == FeedAdFormat.BANNER) "banner" else "native")
        assets?.let { payload.put("assets", it) }
        plugin.emit(event, payload)
    }

    private fun emitFeedFail(error: LoadAdError) {
        val payload = JSObject()
        payload.put("feedAdId", id)
        positionKey?.let { payload.put("positionKey", it) }
        payload.put("format", if (format == FeedAdFormat.BANNER) "banner" else "native")
        payload.put("code", error.code.value)
        payload.put("message", error.message)
        plugin.emit(Generated.Events.FEED_LOAD_FAIL, payload)
    }

    private fun parseColor(hex: String?): Int? {
        if (hex.isNullOrBlank() || !hex.startsWith("#") || hex.length != 7) {
            return null
        }
        return try {
            Color.parseColor(hex)
        } catch (_: IllegalArgumentException) {
            null
        }
    }
}
