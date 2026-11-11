from app.database import SessionLocal
from app.models import Product

IMAGE_URL = "https://rukminim2.flixcart.com/image/1536/1536/kljrvrk0/speaker/mobile-tablet-speaker/o/b/q/go3blu-jbl-original-imagymz3c4yrdqc8.jpeg?q=90"

db = SessionLocal()

try:
    product = db.query(Product).filter(Product.id == 32).first()

    if product and product.name == "JBL Go 3":
        product.image_url = IMAGE_URL
        db.commit()
        db.refresh(product)
        print("SUCCESS:", product.name, "image updated!")
        print(product.image_url)
    else:
        print("Product ID 32 did not match JBL Go 3. No changes made.")

except Exception as e:
    db.rollback()
    print("ERROR:", e)

finally:
    db.close()
    