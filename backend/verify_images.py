"""
Verify all 89 product image URLs return HTTP 200.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import urllib.request
import json
from app.database import SessionLocal
from app.models import Product

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
}

def check_url(url, timeout=10):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, None
    except urllib.error.HTTPError as e:
        return e.code, str(e)
    except Exception as e:
        return 0, str(e)

db = SessionLocal()
raw = db.query(Product).order_by(Product.slug).all()
# Eagerly extract all needed fields while session is open
products = [(p.slug, p.name, p.brand, p.image_url) for p in raw]
db.close()

results = []
failed = []
print(f"Checking {len(products)} product image URLs...\n")

for slug, name, brand, image_url in products:
    status, error = check_url(image_url)
    ok = status == 200
    icon = "✅" if ok else "❌"
    print(f"{icon} [{status}] {slug}: {name[:35]}")
    if not ok:
        print(f"       URL: {image_url}")
        print(f"       ERR: {error}")
        failed.append({"slug": slug, "name": name, "url": image_url, "status": status, "error": error})
    results.append({
        "slug": slug,
        "name": name,
        "brand": brand,
        "image_url": image_url,
        "http_status": status,
        "ok": ok
    })

with open("image_verification_results.json", "w") as f:
    json.dump(results, f, indent=2)

print(f"\n{'='*60}")
print(f"Total: {len(results)} | ✅ OK: {len(results)-len(failed)} | ❌ Failed: {len(failed)}")
if failed:
    print(f"\nFailed products:")
    for f in failed:
        print(f"  - {f['slug']}: {f['name']} [{f['status']}]")
print("Results saved to image_verification_results.json")
