package admob.plus.capacitor.feed

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FeedAdEngineInstallPolicyTest {
    @Test
    fun engineOffDoesNotInstall() {
        assertFalse(shouldInstallEngineChannelForTest(useWebViewNativeUiEngine = false, engineChannelInstalled = false))
        assertFalse(shouldInstallEngineChannelForTest(useWebViewNativeUiEngine = false, engineChannelInstalled = true))
    }

    @Test
    fun engineOnInstallsWhenNotYetInstalled() {
        assertTrue(shouldInstallEngineChannelForTest(useWebViewNativeUiEngine = true, engineChannelInstalled = false))
        assertFalse(shouldInstallEngineChannelForTest(useWebViewNativeUiEngine = true, engineChannelInstalled = true))
    }
}