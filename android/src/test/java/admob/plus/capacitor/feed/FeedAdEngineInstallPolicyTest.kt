package admob.plus.capacitor.feed

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FeedAdEngineInstallPolicyTest {
    @Test
    fun engineOffDoesNotInstall() {
        assertFalse(FeedAdManager.shouldInstallEngineChannel(false, false))
        assertFalse(FeedAdManager.shouldInstallEngineChannel(false, true))
    }

    @Test
    fun engineOnInstallsWhenNotYetInstalled() {
        assertTrue(FeedAdManager.shouldInstallEngineChannel(true, false))
        assertFalse(FeedAdManager.shouldInstallEngineChannel(true, true))
    }

    @Test
    fun createAndBindUseSameInstallGate() {
        assertFalse(FeedAdManager.shouldInstallEngineChannel(false, false))
        assertTrue(FeedAdManager.shouldInstallEngineChannel(true, false))
        assertFalse(FeedAdManager.shouldInstallEngineChannel(true, true))
    }
}