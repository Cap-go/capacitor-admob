package admob.plus.capacitor.ads

import admob.plus.capacitor.ExecuteContext
import admob.plus.capacitor.Generated
import admob.plus.core.Context
import admob.plus.core.GenericAd
import com.google.android.libraries.ads.mobile.sdk.common.AdLoadCallback
import com.google.android.libraries.ads.mobile.sdk.interstitial.InterstitialAd
import com.google.android.libraries.ads.mobile.sdk.interstitial.InterstitialAdEventCallback

class Interstitial(ctx: ExecuteContext?) : AdBase(ctx), GenericAd {
    private var mAd: InterstitialAd? = null
    override fun destroy() {
        clear()
        super.destroy()
    }

    override fun load(ctx: Context?) {
        val requestContext = ctx ?: return
        clear()
        InterstitialAd.load(
            requestContext.optAdRequest(adUnitId),
            object : AdLoadCallback<InterstitialAd> {
                override fun onAdLoaded(interstitialAd: InterstitialAd) {
                    mAd = interstitialAd
                    mAd!!.adEventCallback = object : InterstitialAdEventCallback {
                        override fun onAdDismissedFullScreenContent() {
                            clear()
                            emit(Generated.Events.INTERSTITIAL_DISMISS)
                        }

                        override fun onAdFailedToShowFullScreenContent(error: com.google.android.libraries.ads.mobile.sdk.common.FullScreenContentError) {
                            clear()
                            emit(Generated.Events.INTERSTITIAL_SHOW_FAIL, error)
                        }

                        override fun onAdShowedFullScreenContent() {
                            emit(Generated.Events.INTERSTITIAL_SHOW)
                        }

                        override fun onAdImpression() {
                            emit(Generated.Events.INTERSTITIAL_IMPRESSION)
                        }

                        override fun onAdClicked() {
                            emit(Generated.Events.AD_CLICK)
                        }
                    }
                    emit(Generated.Events.INTERSTITIAL_LOAD)
                    requestContext.resolve()
                }

                override fun onAdFailedToLoad(loadAdError: com.google.android.libraries.ads.mobile.sdk.common.LoadAdError) {
                    clear()
                    emit(Generated.Events.INTERSTITIAL_LOAD_FAIL, loadAdError)
                    requestContext.reject(loadAdError)
                }
            })
    }

    override val isLoaded: Boolean
        get() = mAd != null

    override fun show(ctx: Context?) {
        mAd!!.show(activity)
        ctx?.resolve()
    }

    private fun clear() {
        mAd = null
    }
}
