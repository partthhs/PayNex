from app.database import SessionLocal
from app.models import Product

IMAGE_URL = "https://m.media-amazon.com/images/I/318RvHnDwHL._SY300_SX300_QL70_FMwebp_.jpg"

db = SessionLocal()

try:
    products = db.query(Product).filter(
        Product.name == "Sony WH-CH520 Wireless"
    ).all()

    if len(products) != 1:
        print(f"Expected 1 product, found {len(products)}. No changes made.")
    else:
        product = products[0]
        print("Found:", product.name)
        print("Old image:", product.image_url)

        product.image_url = IMAGE_URL
        db.commit()
        db.refresh(product)

        print("Updated image:", product.image_url)
        print("SUCCESS: Only Sony WH-CH520 was updated.")

except Exception as e:
    db.rollback()
    print("Update failed:", e)

finally:
    db.close()