#!/usr/bin/env python3
"""Capture a banner feed screenshot when CI logcat markers appear."""
import subprocess
import sys
import time

BANNER_RAW = sys.argv[1]
MARKERS = ("ci_banner_slot_ready", "CAPGO_CI_BANNER_SLOT_READY")


def main() -> int:
    proc = subprocess.Popen(
        ["adb", "logcat", "-v", "brief", "CapgoAdmobFeed:I", "Capacitor/Console:I", "*:S"],
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        bufsize=1,
    )
    assert proc.stdout is not None
    try:
        for line in proc.stdout:
            if not any(marker in line for marker in MARKERS):
                continue
            time.sleep(0.45)
            subprocess.run(
                ["adb", "shell", "input", "keyevent", "KEYCODE_WAKEUP"],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            screencap = subprocess.run(
                ["adb", "exec-out", "screencap", "-p"],
                capture_output=True,
                check=False,
            )
            if screencap.returncode == 0 and len(screencap.stdout) > 512:
                with open(BANNER_RAW, "wb") as outfile:
                    outfile.write(screencap.stdout)
                return 0
    finally:
        proc.kill()
        proc.wait(timeout=5)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
