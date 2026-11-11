from app.database import SessionLocal
from app.models import Product

IMAGE_URL = "https://www.sony.co.in/microsite/where-to-buy/Portable-wireless-speakers/srs-xb10/images/xb10.jpg"

db = SessionLocal()

try:
    product = db.query(Product).filter(Product.id == 77).first()

    if product and product.name == "Sony SRS-XB100 Wireless":
        product.image_url = IMAGE_URL
        db.commit()
        db.refresh(product)

        print("SUCCESS: Sony SRS-XB100 image updated!")
        print("New URL:", product.image_url)
    else:
        print("Product ID 77 did not match. No changes made.")

except Exception as e:
    db.rollback()
    print("ERROR:", e)

finally:
    db.close()
    