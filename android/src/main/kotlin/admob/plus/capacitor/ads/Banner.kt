package admob.plus.capacitor.ads

import admob.plus.capacitor.AdMobPlusPlugin
import admob.plus.capacitor.ExecuteContext
import admob.plus.capacitor.Generated
import admob.plus.core.Context
import admob.plus.core.GenericAd
import admob.plus.core.Helper.Companion.getParentView
import admob.plus.core.Helper.Companion.removeFromParentView
import android.annotation.SuppressLint
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.LinearLayout
import com.google.android.libraries.ads.mobile.sdk.banner.AdSize
import com.google.android.libraries.ads.mobile.sdk.banner.AdView
import com.google.android.libraries.ads.mobile.sdk.banner.BannerAd
import com.google.android.libraries.ads.mobile.sdk.banner.BannerAdEventCallback
import com.google.android.libraries.ads.mobile.sdk.common.AdLoadCallback
import java.util.Objects

class Banner(ctx: ExecuteContext) : AdBase(ctx), GenericAd {
    private val gravity: Int
    private var adView: AdView? = null
    private var loaded = false

    init {
        gravity = if ("top" == ctx.optPosition()) Gravity.TOP else Gravity.BOTTOM
    }

    override val isLoaded: Boolean
        get() = loaded

    override fun load(ctx: Context?) {
        if (adView == null) {
            adView = AdView(activity)
        }

        loaded = false
        val adSize = resolveAdSize()
        val collapsibleAnchor = if (gravity == Gravity.TOP) "top" else "bottom"

        adView!!.loadAd(
            ctx!!.optBannerAdRequest(adUnitId, adSize, collapsibleAnchor),
            object : AdLoadCallback<BannerAd> {
                override fun onAdLoaded(bannerAd: BannerAd) {
                    loaded = true
                    bannerAd.adEventCallback = object : BannerAdEventCallback {
                        override fun onAdClicked() {
                            emit(Generated.Events.BANNER_CLICK)
                        }

                        override fun onAdDismissedFullScreenContent() {
                            emit(Generated.Events.BANNER_CLOSE)
                        }

                        override fun onAdImpression() {
                            emit(Generated.Events.BANNER_IMPRESSION)
                        }

                        override fun onAdShowedFullScreenContent() {
                            emit(Generated.Events.BANNER_OPEN)
                        }
                    }
                    emit(Generated.Events.BANNER_LOAD)
                    ctx.resolve()
                }

                override fun onAdFailedToLoad(loadAdError: com.google.android.libraries.ads.mobile.sdk.common.LoadAdError) {
                    loaded = false
                    emit(Generated.Events.BANNER_LOAD_FAIL, loadAdError)
                    ctx.reject(loadAdError.message)
                }
            }
        )
    }

    override fun show(ctx: Context?) {
        Objects.requireNonNull(adView)
        val webView: WebView = ExecuteContext.Companion.plugin!!.getBridge().getWebView()
        if (getParentView(adView) == null) {
            addBannerView(ExecuteContext.Companion.plugin, adView)
        } else if (adView!!.visibility == View.GONE) {
            adView!!.visibility = View.VISIBLE
        } else {
            val wvParentView = getParentView(webView)
            if (parentView !== wvParentView) {
                parentView!!.removeAllViews()
                removeFromParentView(parentView)
                addBannerView(ExecuteContext.Companion.plugin, adView)
            }
        }
        ctx!!.resolve()
    }

    override fun hide(ctx: Context?) {
        if (adView != null) {
            adView!!.visibility = View.GONE
        }
        ctx!!.resolve()
    }

    override fun destroy() {
        if (adView != null) {
            loaded = false
            adView!!.destroy()
            adView = null
        }
        super.destroy()
    }

    private fun addBannerView(plugin: AdMobPlusPlugin?, adView: AdView?) {
        val webView = plugin!!.bridge.webView
        val wvParentView = webView.parent as ViewGroup
        if (parentView == null) {
            parentView = LinearLayout(webView.context)
        }
        if (wvParentView != null && wvParentView !== parentView) {
            if (getParentView(parentView) != null) {
                parentView!!.removeAllViews()
                removeFromParentView(parentView)
            }
            wvParentView.removeView(webView)
            val content = parentView as LinearLayout?
            content!!.orientation = LinearLayout.VERTICAL
            content.setLayoutParams(
                LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    0.0f
                )
            )
            webView.layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
                1.0f
            )
            content.addView(webView)
            wvParentView.addView(parentView)
        }
        if (gravity == Gravity.TOP) {
            parentView!!.addView(adView, 0)
        } else {
            parentView!!.addView(adView)
        }
        parentView!!.bringToFront()
        parentView!!.requestLayout()
        parentView!!.requestFocus()
    }

    private fun resolveAdSize(): AdSize {
        val displayMetrics: DisplayMetrics = activity.resources.displayMetrics
        val adWidth = (displayMetrics.widthPixels / displayMetrics.density).toInt().coerceAtLeast(1)
        return AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(activity, adWidth)
    }

    companion object {
        @SuppressLint("StaticFieldLeak")
        private var parentView: ViewGroup? = null
    }
}
