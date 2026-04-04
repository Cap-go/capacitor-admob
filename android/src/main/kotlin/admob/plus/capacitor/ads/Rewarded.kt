package admob.plus.capacitor.ads

import admob.plus.capacitor.ExecuteContext
import admob.plus.capacitor.Generated
import admob.plus.core.Context
import admob.plus.core.GenericAd
import com.google.android.libraries.ads.mobile.sdk.common.AdLoadCallback
import com.google.android.libraries.ads.mobile.sdk.rewarded.RewardItem
import com.google.android.libraries.ads.mobile.sdk.rewarded.RewardedAd
import com.google.android.libraries.ads.mobile.sdk.rewarded.RewardedAdEventCallback

class Rewarded(ctx: ExecuteContext?) : AdBase(ctx), GenericAd {
    private var mAd: RewardedAd? = null
    override fun destroy() {
        clear()
        super.destroy()
    }

    override fun load(ctx: Context?) {
        val requestContext = ctx ?: return
        clear()
        RewardedAd.load(
            requestContext.optAdRequest(adUnitId),
            object : AdLoadCallback<RewardedAd> {
                override fun onAdFailedToLoad(loadAdError: com.google.android.libraries.ads.mobile.sdk.common.LoadAdError) {
                    clear()
                    emit(Generated.Events.REWARDED_LOAD_FAIL, loadAdError)
                    requestContext.reject(loadAdError)
                }

                override fun onAdLoaded(rewardedAd: RewardedAd) {
                    mAd = rewardedAd
                    val ssv = requestContext.optServerSideVerificationOptions()
                    if (ssv != null) {
                        mAd!!.setServerSideVerificationOptions(ssv)
                    }
                    mAd!!.adEventCallback = object : RewardedAdEventCallback {
                        override fun onAdDismissedFullScreenContent() {
                            clear()
                            emit(Generated.Events.REWARDED_DISMISS)
                        }

                        override fun onAdFailedToShowFullScreenContent(error: com.google.android.libraries.ads.mobile.sdk.common.FullScreenContentError) {
                            clear()
                            emit(Generated.Events.REWARDED_SHOW_FAIL, error)
                        }

                        override fun onAdShowedFullScreenContent() {
                            emit(Generated.Events.REWARDED_SHOW)
                        }

                        override fun onAdImpression() {
                            emit(Generated.Events.REWARDED_IMPRESSION)
                        }

                        override fun onAdClicked() {
                            emit(Generated.Events.AD_CLICK)
                        }
                    }
                    emit(Generated.Events.REWARDED_LOAD)
                    requestContext.resolve()
                }
            })
    }

    override val isLoaded: Boolean
        get() = mAd != null

    override fun show(ctx: Context?) {
        val ad = mAd ?: run {
            ctx?.reject("ad is not loaded")
            return
        }
        ad.show(activity) { rewardItem: RewardItem? ->
            if (rewardItem != null) {
                emit(Generated.Events.REWARDED_REWARD, rewardItem)
            }
        }
        ctx?.resolve()
    }

    private fun clear() {
        mAd = null
    }
}
