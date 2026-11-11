from app.database import SessionLocal
from app.models import Product

IMAGE_URL = "https://m.media-amazon.com/images/I/31UjVjrQ4vL._SY300_SX300_QL70_FMwebp_.jpg"

db = SessionLocal()

try:
    product = db.query(Product).filter(Product.id == 84).first()

    if product and product.name == "Logitech C920x HD Pro Webcam":
        product.image_url = IMAGE_URL
        db.commit()
        db.refresh(product)

        print("SUCCESS: Logitech C920x HD Pro Webcam image updated!")
        print("New URL:", product.image_url)
    else:
        print("Product ID 84 did not match. No changes made.")

except Exception as e:
    db.rollback()
    print("ERROR:", e)

finally:
    db.close()