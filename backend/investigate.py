import urllib.request
import json
from app.database import SessionLocal
from app.models import Category, Product
from sqlalchemy import func

db = SessionLocal()
try:
    total_db = db.query(Product).count()
    print(f"1. Total products in PostgreSQL: {total_db}")

    print("\n2. Products per category in PostgreSQL:")
    cats = db.query(Category).all()
    for c in cats:
        cnt = db.query(Product).filter(Product.category_id == c.id).count()
        in_stock_cnt = db.query(Product).filter(Product.category_id == c.id, Product.in_stock == True).count()
        print(f" - {c.name} ({c.slug}): {cnt} total ({in_stock_cnt} in stock)")

    print("\n3. API GET /api/v1/products response:")
    req = urllib.request.Request("http://localhost:8000/api/v1/products")
    with urllib.request.urlopen(req) as resp:
        api_data = json.loads(resp.read().decode())
        print(f" - Total reported by API: {api_data.get('total')}")
        print(f" - Page: {api_data.get('page')}")
        print(f" - Page Size: {api_data.get('page_size')}")
        print(f" - Total Pages: {api_data.get('total_pages')}")
        print(f" - Items returned in this page: {len(api_data.get('items', []))}")

finally:
    db.close()
