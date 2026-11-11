"""
Verify all 89 products load from http://localhost:8000/static/images/<file> with HTTP 200.
"""
import urllib.request
import json
from app.database import SessionLocal
from app.models import Product

db = SessionLocal()
products = db.query(Product).order_by(Product.slug).all()

ok = 0
failed = []

for p in products:
    url = p.image_url
    try:
        r = urllib.request.urlopen(url, timeout=5)
        if r.status == 200:
            ok += 1
            print(f"✅ [{r.status}] {p.slug} -> {url}")
        else:
            failed.append((p.slug, url, r.status))
            print(f"❌ [{r.status}] {p.slug} -> {url}")
    except Exception as e:
        failed.append((p.slug, url, str(e)))
        print(f"❌ [ERR] {p.slug} -> {url} : {e}")

db.close()

print(f"\n==============================================")
print(f"Total Products: {len(products)}")
print(f"Verified 200 OK: {ok}")
print(f"Failed: {len(failed)}")
print(f"==============================================")
