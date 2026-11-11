from app.database import SessionLocal
from app.models import Product

IMAGE_URL = "https://in.jbl.com/dw/image/v2/BFND_PRD/on/demandware.static/-/Sites-masterCatalog_Harman/default/dw9637c6a8/JBL_CHARGE5_HERO_CAMO_0049_x2.png?sw=535&sh=535"

db = SessionLocal()

try:
    product = db.query(Product).filter(Product.id == 81).first()

    if product and product.name == "JBL Charge 5":
        product.image_url = IMAGE_URL
        db.commit()
        db.refresh(product)

        print("SUCCESS: JBL Charge 5 image updated!")
        print("New URL:", product.image_url)
    else:
        print("Product ID 81 did not match. No changes made.")

except Exception as e:
    db.rollback()
    print("ERROR:", e)

finally:
    db.close()