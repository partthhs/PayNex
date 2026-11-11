from app.database import SessionLocal
from app.models import Product

IMAGE_URL = "https://image01-in.oneplus.net/ebp/202404/28/1-M00-52-A7-CpgM7WYuF52AI8oUAAK7YVYiXxU615.png?x-amz-process=image/format,webp/quality,Q_80"

db = SessionLocal()

try:
    product = db.query(Product).filter(Product.id == 22).first()

    if product and product.name == "OnePlus Nord Buds 2":
        product.image_url = IMAGE_URL
        db.commit()
        db.refresh(product)

        print("SUCCESS: OnePlus Nord Buds 2 image updated!")
        print("New URL:", product.image_url)
    else:
        print("Product ID 22 did not match. No changes made.")

except Exception as e:
    db.rollback()
    print("ERROR:", e)

finally:
    db.close()