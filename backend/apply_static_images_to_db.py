"""
Map each product to its locally cached, guaranteed asset under http://localhost:8000/static/images/
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app.models import Product

IMAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "images")
files = os.listdir(IMAGE_DIR)

db = SessionLocal()
products = db.query(Product).all()

applied = 0
for p in products:
    # Find matching cached image file for this slug
    match = None
    for f in files:
        base, _ = os.path.splitext(f)
        if base == p.slug:
            match = f
            break
    if match:
        p.image_url = f"http://localhost:8000/static/images/{match}"
        applied += 1
        print(f"Set {p.slug} -> {p.image_url}")

db.commit()
db.close()
print(f"\nApplied local static image URLs for {applied} / {len(products)} products!")
