from app.database import SessionLocal
from app.models import Product

IMAGE_URL = "https://image01-in.oneplus.net/media/202407/04/ec110c268359ca0ba2943085bee362d6.png?x-amz-process=image/format,webp/quality,Q_80"

db = SessionLocal()

try:
    product = db.query(Product).filter(Product.id == 18).first()

    if product and product.name == "OnePlus Nord CE 4":
        product.image_url = IMAGE_URL
        db.commit()
        db.refresh(product)

        print("SUCCESS: Image updated!")
        print("New URL:", product.image_url)
    else:
        print("Product not found or name mismatch. No changes made.")

except Exception as e:
    db.rollback()
    print("ERROR:", e)

finally:
    db.close()