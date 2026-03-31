package admob.plus.core

import android.R
import android.app.Activity
import android.view.ViewGroup
import com.google.android.libraries.ads.mobile.sdk.common.FullScreenContentError
import com.google.android.libraries.ads.mobile.sdk.common.LoadAdError
import com.google.android.libraries.ads.mobile.sdk.rewarded.RewardItem
import java.util.Objects

abstract class Ad(val id: Int, val adUnitId: String) {
    init {
        Helper.ads.put(id, this)
    }

    constructor(ctx: Context) : this(
        Objects.requireNonNull<Int?>(ctx.optId()),
        Objects.requireNonNull<String?>(ctx.optAdUnitID())
    )

    open fun destroy() {
        Helper.ads.remove(id)
    }

    protected abstract val adapter: Helper.Adapter
    val activity: Activity
        get() = adapter.activity
    val contentView: ViewGroup?
        get() = activity.findViewById(R.id.content)

    protected fun emit(eventName: String?, error: LoadAdError) {
        this.emit(eventName, object : HashMap<String?, Any?>() {
            init {
                put("code", error.code.value)
                put("message", error.message)
            }
        })
    }

    protected fun emit(eventName: String?, error: FullScreenContentError) {
        this.emit(eventName, object : HashMap<String?, Any?>() {
            init {
                put("code", error.code.value)
                put("message", error.message)
            }
        })
    }

    protected fun emit(eventName: String?, rewardItem: RewardItem) {
        this.emit(eventName, object : HashMap<String?, Any?>() {
            init {
                put("reward", object : HashMap<String?, Any?>() {
                    init {
                        put("amount", rewardItem.amount)
                        put("type", rewardItem.type)
                    }
                })
            }
        })
    }

    protected fun emit(eventName: String?, data: Map<String?, Any?>? = HashMap()) {
        adapter.emit(eventName, object : HashMap<String?, Any?>(data) {
            init {
                put("adId", id)
            }
        })
    }
}
