from app.database import SessionLocal
from app.models import Product

IMAGE_URL = "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-model-unselect-gallery-1-202503_GEO_EMEA?wid=5120&hei=2880&fmt=webp&qlt=90&.v=dktPcGxtcUZybE1aYXJWSm5YZmZNcWpkNHRJWDMzcTg3NWRxV0pydTcvSlByOXViSXE1c1NoU0NmeElPMkdrZTBoUVhuTWlrY2hIK090ZGZZbk9HeEJWb1BiTjRORlc1Y1lKU3JWempySklFTSsyM01CRUUxMmZMdVlZL3hza3lmbW94YnYxc1YvNXZ4emJGL0IxNFp3&traceId=1"

db = SessionLocal()

try:
    product = db.query(Product).filter(Product.id == 30).first()

    if product and product.name == "Apple iPad 10th Gen":
        product.image_url = IMAGE_URL
        db.commit()
        db.refresh(product)

        print("SUCCESS: Apple iPad image updated!")
        print("New URL:", product.image_url)
    else:
        print("Product ID 30 did not match. No changes made.")

except Exception as e:
    db.rollback()
    print("ERROR:", e)

finally:
    db.close()