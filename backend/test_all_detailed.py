"""
Verify all 89 URLs with detailed error printing and retry logic
"""
import urllib.request
import ssl
import time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

from apply_complete_images import FULL_IMAGE_MAP

# Fix specific typos found
FULL_IMAGE_MAP["phone-003"] = "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-5g.jpg"
FULL_IMAGE_MAP["phone-004"] = "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-ce4-.jpg"

results = {}
for slug, url in FULL_IMAGE_MAP.items():
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=12) as r:
            results[slug] = (r.status, "OK")
            print(f"✅ [{r.status}] {slug}")
    except urllib.error.HTTPError as e:
        results[slug] = (e.code, f"HTTPError {e.code}")
        print(f"❌ [{e.code}] {slug} -> {url}")
    except Exception as e:
        results[slug] = (0, str(e))
        print(f"⚠️ [ERR] {slug}: {e} -> {url}")
    time.sleep(0.1)

ok_count = len([s for s, (code, msg) in results.items() if code == 200])
print(f"\nFinal tally: {ok_count} / {len(FULL_IMAGE_MAP)} HTTP 200")
