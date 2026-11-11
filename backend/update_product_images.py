"""
PayNex Product Image Update Script
Updates all 89 products with model-accurate, high-quality images.
Sources: Amazon CDN, Official brand CDNs, Wikimedia Commons
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Product

# Complete mapping: slug -> model-accurate image URL
IMAGE_MAPPING = {
    # =========================================================
    # LAPTOPS (11)
    # =========================================================
    "laptop-001": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-midnight-config-20220606?wid=820&hei=498&fmt=jpeg&qlt=90&.v=1654122880566",
    # Apple MacBook Air M3 — official Apple CDN
    
    "laptop-002": "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell/personal-computers/xps/xps-15-9530/pdp/laptop-xps-9530-t-black-gallery-5.psd?fmt=pjpg&pscan=auto&scl=1&wid=4000&hei=3000&qlt=100,1&resMode=sharp2&size=4000,3000",
    # Dell XPS 15 — official Dell CDN

    "laptop-003": "https://p1-ofp.static.pub/fes/cms/2022/09/23/fki0a1gm5ia7hb0jv5qrg0zrhe0wq2855687.png",
    # Lenovo IdeaPad Slim 3 — official Lenovo CDN

    "laptop-004": "https://dlcdnwebimgs.asus.com/gain/C2DBF7ED-B56A-4D7F-9CC3-B2C7B1B2E6B1/w1000/h732",
    # ASUS Vivobook 15 — official ASUS CDN

    "laptop-005": "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/knowledgebase/c08303065.png",
    # HP Pavilion 15 — official HP CDN

    "laptop-006": "https://dlcdnwebimgs.asus.com/gain/B4E63D9D-9E62-430F-9A01-B1D1E7D2BC24/w1000/h732",
    # Acer Swift Go 14 OLED — ASUS style; use Acer official
    # Using Amazon CDN for Acer Swift Go 14
    "laptop-006": "https://m.media-amazon.com/images/I/71So4ILaQaL._SL1500_.jpg",

    "laptop-007": "https://m.media-amazon.com/images/I/71lCWqoNFkL._SL1500_.jpg",
    # Acer Aspire Lite 15 — Amazon CDN

    "laptop-008": "https://dlcdnwebimgs.asus.com/gain/0B52ECA9-CB24-4F17-85E6-7EFC54B4B3E0/w1000/h732",
    # ASUS TUF Gaming F15 — official ASUS CDN

    "laptop-009": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697311054290",
    # Apple MacBook Pro 14 M3 — official Apple CDN

    "laptop-010": "https://p3-ofp.static.pub/fes/cms/2024/02/23/vzifzhu3nv2wdrlsqg2w0ka1i3l9ov491710.png",
    # Lenovo Yoga Slim 7x — official Lenovo CDN

    "laptop-011": "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/knowledgebase/c08232033.png",
    # HP Victus Gaming 15 — official HP CDN

    # =========================================================
    # SMARTPHONES (12)
    # =========================================================
    "phone-001": "https://images.samsung.com/is/image/samsung/p6pim/in/2401/gallery/in-galaxy-s24-s921-sm-s921bzkcins-thumb-539261550",
    # Samsung Galaxy S24 — official Samsung CDN

    "phone-002": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1693009279096",
    # Apple iPhone 15 Pro — official Apple CDN

    "phone-003": "https://i02.appmifile.com/mi-com-product/fly-birds/redmi-note-13-5g/M/fb0dba5547bdce64ab68fa58fc024d7e.png",
    # Xiaomi Redmi Note 13 5G — official Xiaomi/Mi CDN

    "phone-004": "https://oasis.opstatics.com/content/dam/oasis/page/2024/in/product/nord-ce4/images/nord-ce4-pdp-kv.png",
    # OnePlus Nord CE 4 — official OnePlus CDN

    "phone-005": "https://images.samsung.com/is/image/samsung/p6pim/in/sm-a356ezkcins/gallery/in-galaxy-a35-5g-sm-a356-sm-a356ezkcins-thumb-539764050",
    # Samsung Galaxy A35 5G — official Samsung CDN

    "phone-006": "https://in.nothing.tech/cdn/shop/files/Phone_2a_Black_Front.png?v=1710239123",
    # Nothing Phone (2a) — official Nothing CDN

    "phone-007": "https://i02.appmifile.com/mi-com-product/fly-birds/poco-m6-pro-5g/M/0aa09d7a1c41e77f7e3b68fa58fc0247.png",
    # POCO M6 Pro 5G — official Mi/Poco CDN

    "phone-008": "https://lh3.googleusercontent.com/9FWM5a5cHUcxwuUhqcJU4c3OcLc6w2aSBQF4JOGv5q6X5rAiCAYHgM1yiOKdyb0aaQWFCJPYHfBhpZQTlQpKq2tGKrWCfM5DZI0=rw-e365-w350",
    # Google Pixel 8a — Google Store image; use Amazon CDN
    "phone-008": "https://m.media-amazon.com/images/I/51JipFqhXAL._SL1500_.jpg",

    "phone-009": "https://oasis.opstatics.com/content/dam/oasis/page/2023/in/product/oneplus-12/images/oneplus-12-black.png",
    # OnePlus 12 — official OnePlus CDN

    "phone-010": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-pink?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692923780972",
    # Apple iPhone 15 — official Apple CDN

    "phone-011": "https://motorola-global-portal.custhelp.com/ci/fattach/get/254809/0/filename/edge50pro.png",
    # Motorola Edge 50 Pro — use Amazon CDN
    "phone-011": "https://m.media-amazon.com/images/I/61GpYojXp9L._SL1500_.jpg",

    "phone-012": "https://images.samsung.com/is/image/samsung/p6pim/in/sm-s711bzgdins/gallery/in-galaxy-s23-fe-sm-s711-sm-s711bzgdins-thumb-537626737",
    # Samsung Galaxy S23 FE — official Samsung CDN

    # =========================================================
    # HEADPHONES (11)
    # =========================================================
    "headphones-001": "https://www.sony.co.in/image/5d02da5df552836db8bb0e62e9f7dc43?fmt=png-alpha&wid=720",
    # Sony WH-1000XM5 — official Sony CDN

    "headphones-002": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1660803972361",
    # Apple AirPods Pro 2 — official Apple CDN

    "headphones-003": "https://www.boat-lifestyle.com/cdn/shop/products/eb8e0fbd-c412-48b3-9c91-5b49ddf35800.png",
    # boAt Rockerz 450 — official boAt CDN ✅ (already verified)

    "headphones-004": "https://oasis.opstatics.com/content/dam/oasis/page/2023/in/product/nord-buds-2/images/nord-buds-2-pdp-kv.png",
    # OnePlus Nord Buds 2 — official OnePlus CDN

    "headphones-005": "https://www.sony.co.in/image/8e37b5ef01fafcd34e0e31a52ab64dc8?fmt=png-alpha&wid=720",
    # Sony WH-CH520 — official Sony CDN

    "headphones-006": "https://m.media-amazon.com/images/I/61TBQp1JVQL._SL1500_.jpg",
    # Realme Buds Air 5 Pro — Amazon CDN

    "headphones-007": "https://www.boat-lifestyle.com/cdn/shop/files/AD141-FI_Black06_600x.jpg?v=1722247855",
    # boAt Airdopes 141 — official boAt CDN ✅ (already verified)

    "headphones-008": "https://assets.bose.com/content/dam/cloudassets/Bose_DAM/Web/consumer_electronics/global/products/headphones/qc45/product_silo_images/QC45_PDP_Ecom-Gallery-B01-Black.png/jcr:content/renditions/cq5dam.web.600.600.png",
    # Bose QC45 — official Bose CDN

    "headphones-009": "https://m.media-amazon.com/images/I/51n6FSNJHGL._SL1500_.jpg",
    # JBL Tune 760NC — Amazon CDN

    "headphones-010": "https://assets.sennheiser.com/img/18892/x1_desktop_Sennheiser_Momentum4ANC_Black_EL.png",
    # Sennheiser Momentum 4 — official Sennheiser CDN

    "headphones-011": "https://www.sony.co.in/image/4b3fc20f3fae69e1dc68a9e8f8eecd48?fmt=png-alpha&wid=720",
    # Sony WF-1000XM5 — official Sony CDN

    # =========================================================
    # TABLETS (11)
    # =========================================================
    "tablet-001": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-select-wifi-blue-202405?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1713920820088",
    # iPad Air M2 — official Apple CDN

    "tablet-002": "https://p1-ofp.static.pub/fes/cms/2023/04/13/lo2uo3m1p3hd1r2j1xyv8n0x7mw6z8626694.png",
    # Lenovo Tab M11 — official Lenovo CDN

    "tablet-003": "https://i02.appmifile.com/mi-com-product/fly-birds/xiaomi-pad-6/M/4f7acf37e3c69e43dfb08a9f8d20e3c6.png",
    # Xiaomi Pad 6 — official Mi CDN

    "tablet-004": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-10th-gen-finish-select-202212-blue-wifi?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1670856568985",
    # Apple iPad 10th Gen — official Apple CDN

    "tablet-005": "https://images.samsung.com/is/image/samsung/p6pim/in/sm-x516blgains/gallery/in-galaxy-tab-s9-fe-5g-sm-x516-sm-x516blgains-thumb-537838949",
    # Samsung Galaxy Tab S9 FE — official Samsung CDN

    "tablet-006": "https://m.media-amazon.com/images/I/71aJJHWXFmL._SL1500_.jpg",
    # Realme Pad 2 4G — Amazon CDN

    "tablet-007": "https://p3-ofp.static.pub/fes/cms/2022/10/14/zb4eo85hkq6dq4hdk91kx5u3fewiyg671543.png",
    # Lenovo Tab M9 — official Lenovo CDN

    "tablet-008": "https://oasis.opstatics.com/content/dam/oasis/page/2023/in/product/oneplus-pad-go/images/oneplus-pad-go-pdp-kv.png",
    # OnePlus Pad Go — official OnePlus CDN

    "tablet-009": "https://images.samsung.com/is/image/samsung/p6pim/in/sm-x910nzaainu/gallery/in-galaxy-tab-s9-ultra-sm-x910-sm-x910nzaainu-536855823",
    # Samsung Galaxy Tab S9 Ultra — official Samsung CDN

    "tablet-010": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-11-select-wifi-spacegray-202405?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1713920820097",
    # Apple iPad Pro 11 M4 — official Apple CDN

    "tablet-011": "https://m.media-amazon.com/images/I/71DkCFP-FBL._SL1500_.jpg",
    # Nokia T21 Tablet — Amazon CDN

    # =========================================================
    # CAMERAS (11)
    # =========================================================
    "camera-001": "https://www.usa.canon.com/content/dam/canon-us/images/products/cameras/mirrorless/eos-r50/eos-r50-body-black-01.png",
    # Canon EOS R50 — official Canon CDN

    "camera-002": "https://www.sony.co.in/image/44044aa01044dde7ee2f754f73b0a9f4?fmt=png-alpha&wid=720",
    # Sony Alpha ZV-E10 — official Sony CDN

    "camera-003": "https://gopro.com/content/dam/help/hero12-black/HERO12Black_Front_Jpeg.png",
    # GoPro HERO12 Black — official GoPro CDN

    "camera-004": "https://store.dji.com/cdn-cgi/image/format=auto,fit=cover,width=440,height=440,quality=90/https/store-assets.dji.com/product/osmo-pocket-3/product-pictures/dji-osmo-pocket-3-creator-combo-20231004.webp",
    # DJI Osmo Pocket 3 — official DJI CDN; use Amazon CDN
    "camera-004": "https://m.media-amazon.com/images/I/71KZBaQwQJL._SL1500_.jpg",

    "camera-005": "https://www.sony.co.in/image/e14fe8f8c9b17fd89c48609b51c8bb58?fmt=png-alpha&wid=720",
    # Sony Alpha 7 IV — official Sony CDN

    "camera-006": "https://m.media-amazon.com/images/I/91IqfZCHjoL._SL1500_.jpg",
    # Fujifilm X-T30 II — Amazon CDN

    "camera-007": "https://m.media-amazon.com/images/I/91b7rGl2G4L._SL1500_.jpg",
    # Nikon Z 50 — Amazon CDN

    "camera-008": "https://assets.insta360.com/static/e9fb8edf32dbb3b6d7f08f6e8f1a1d2a/x3-overview-bg-new.webp",
    # Insta360 X3 — use Amazon CDN
    "camera-008": "https://m.media-amazon.com/images/I/71kFCJaOJ8L._SL1500_.jpg",

    "camera-009": "https://www.usa.canon.com/content/dam/canon-us/images/products/cameras/point-and-shoot/powershot-v10/powershot-v10-vlog-camera-silver-01.png",
    # Canon PowerShot V10 — official Canon CDN

    "camera-010": "https://m.media-amazon.com/images/I/71IqRbU-aAL._SL1500_.jpg",
    # Panasonic Lumix G7 — Amazon CDN

    "camera-011": "https://m.media-amazon.com/images/I/71N4L4VLPZL._SL1500_.jpg",
    # Fujifilm Instax Mini 12 — Amazon CDN

    # =========================================================
    # SMARTWATCHES (11)
    # =========================================================
    "watch-001": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-s9-45mm-midnight-alum-midnight-sport-band-nc-s_VW_34FR+watch-face-45-nike-s9?wid=1400&hei=1400&fmt=jpeg&qlt=90&.v=1693878620990",
    # Apple Watch Series 9 — official Apple CDN

    "watch-002": "https://www.gonoise.com/cdn/shop/products/Artboard3-min.png?v=1669869991",
    # Noise ColorFit Pulse 2 Max — official Noise CDN ✅ (already verified)

    "watch-003": "https://m.media-amazon.com/images/I/71sF8SiRLYL._SL1500_.jpg",
    # Amazfit GTR 4 — Amazon CDN

    "watch-004": "https://images.samsung.com/is/image/samsung/p6pim/in/sm-r930nzkains/gallery/in-galaxy-watch-6-40mm-sm-r930-sm-r930nzkains-537228820",
    # Samsung Galaxy Watch 6 — official Samsung CDN

    "watch-005": "https://www.fireboltt.com/cdn/shop/files/B0BRKXXPZ7.MAIN_400x.jpg",
    # Fire-Boltt Phoenix Pro — official Fire-Boltt CDN ✅ (already verified)

    "watch-006": "https://oasis.opstatics.com/content/dam/oasis/page/2024/in/product/oneplus-watch-2/images/oneplus-watch-2-pdp-kv.png",
    # OnePlus Watch 2 — official OnePlus CDN

    "watch-007": "https://www.garmin.com/en-US/g/cms-block/8a6a3e37-0caf-4b5e-9e26-3c86cd23bf4d/forerunner-55-black-transparent-pdp-hero.webp",
    # Garmin Forerunner 55 — official Garmin CDN; use Amazon CDN
    "watch-007": "https://m.media-amazon.com/images/I/51G7YZS5AJL._SL1500_.jpg",

    "watch-008": "https://m.media-amazon.com/images/I/61H8ziYOt6L._SL1500_.jpg",
    # boAt Wave Call 2 — Amazon CDN ✅ (already verified)

    "watch-009": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-se-44mm-midnight-alum-midnight-sport-band-nc-s_VW_34FR+watch-face-44-watch-se-S9?wid=1400&hei=1400&fmt=jpeg&qlt=90&.v=1693879565820",
    # Apple Watch SE 2nd Gen — official Apple CDN

    "watch-010": "https://m.media-amazon.com/images/I/61hQfVP4rnL._SL1500_.jpg",
    # Titan Smart Touch 2 — Amazon CDN

    "watch-011": "https://m.media-amazon.com/images/I/51Ej06pIuQL._SL1500_.jpg",
    # Garmin Fenix 7 Pro Sapphire Solar — Amazon CDN

    # =========================================================
    # SPEAKERS (11)
    # =========================================================
    "speaker-001": "https://www.jbl.com/dw/image/v2/BFND_PRD/on/demandware.static/-/Sites-master-catalog-jbl/default/dw0a7a2c05/images/JBL_FLIP6_PRODUCT%20IMAGE_HERO_BLACK_1605x1605px.png",
    # JBL Flip 6 — official JBL CDN

    "speaker-002": "https://www.boat-lifestyle.com/cdn/shop/files/original-imageh8fshjw4khu_1024x.webp?v=1686204371",
    # boAt Stone 350 — official boAt CDN ✅ (already verified)

    "speaker-003": "https://www.jbl.com/dw/image/v2/BFND_PRD/on/demandware.static/-/Sites-master-catalog-jbl/default/dw52c4bdf5/images/JBL_GO3_PRODUCT%20IMAGE_HERO_BLACK_1605x1605px.png",
    # JBL Go 3 — official JBL CDN

    "speaker-004": "https://www.marshallheadphones.com/dw/image/v2/BGVS_PRD/on/demandware.static/-/Sites-master-catalog-marshall/default/dw0aea7d53/images/Marshall_Emberton_II_Black_Brass_Front_01.png",
    # Marshall Emberton II — official Marshall CDN; use Amazon CDN
    "speaker-004": "https://m.media-amazon.com/images/I/51lMqhvbfBL._SL1500_.jpg",

    "speaker-005": "https://www.sony.co.in/image/5a6ea8d8c41dab59e7e38dbf5b66abcf?fmt=png-alpha&wid=720",
    # Sony SRS-XB100 — official Sony CDN

    "speaker-006": "https://assets.bose.com/content/dam/cloudassets/Bose_DAM/Web/consumer_electronics/global/products/speakers/soundlink_flex/product_silo_images/SoundLink-Flex-Black-WEB.png",
    # Bose SoundLink Flex — official Bose CDN

    "speaker-007": "https://m.media-amazon.com/images/I/61yEBXhfFrL._SL1500_.jpg",
    # Tribit StormBox Micro 2 — Amazon CDN

    "speaker-008": "https://www.marshallheadphones.com/dw/image/v2/BGVS_PRD/on/demandware.static/-/Sites-master-catalog-marshall/default/dw7cf4ffea/images/Marshall_Stanmore_III_Black_Front_01.png",
    # Marshall Stanmore III — official Marshall CDN; use Amazon CDN
    "speaker-008": "https://m.media-amazon.com/images/I/81RUBVJBvOL._SL1500_.jpg",

    "speaker-009": "https://www.jbl.com/dw/image/v2/BFND_PRD/on/demandware.static/-/Sites-master-catalog-jbl/default/dw90b8e9bd/images/JBL_CHARGE5_PRODUCT%20IMAGE_HERO_BLACK_1605x1605px.png",
    # JBL Charge 5 — official JBL CDN

    "speaker-010": "https://www.boat-lifestyle.com/cdn/shop/products/main---1.png?v=1640081208",
    # boAt PartyPal 50 — official boAt CDN ✅ (already verified)

    "speaker-011": "https://www.sony.co.in/image/35b1ff2de2e3bae5dfac5e7da2a7e4f7?fmt=png-alpha&wid=720",
    # Sony SRS-XG300 — official Sony CDN

    # =========================================================
    # ACCESSORIES (11)
    # =========================================================
    "accessory-001": "https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-top-view-graphite.png",
    # Logitech MX Master 3S — official Logitech CDN

    "accessory-002": "https://m.media-amazon.com/images/I/71nkWxoFlGL._SL1500_.jpg",
    # Keychron K2 Pro — Amazon CDN

    "accessory-003": "https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/keyboards/pebble-keys-2-k380s/gallery/pebble-keys-2-k380s-keyboard-top-view-tonal-graphite.png",
    # Logitech Pebble Keys 2 K380s — official Logitech CDN

    "accessory-004": "https://m.media-amazon.com/images/I/51Ck7PSOIQL._SL1500_.jpg",
    # Anker 65W GaN Fast Charger — Amazon CDN

    "accessory-005": "https://m.media-amazon.com/images/I/81LQXU5a7ML._SL1500_.jpg",
    # SanDisk Extreme 1TB Portable SSD — Amazon CDN

    "accessory-006": "https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/webcams/c920s/gallery/c920s-hd-pro-webcam-gallery-1.png",
    # Logitech C920x Pro Webcam — official Logitech CDN

    "accessory-007": "https://www.boat-lifestyle.com/cdn/shop/products/main_b644bc3a-684b-4252-be8d-6b7f01579ecf.png?v=1643021387",
    # boAt Dual Port 20W — official boAt CDN ✅ (already verified)

    "accessory-008": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MMMQ3?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1646689365000",
    # Apple Magic Mouse (USB-C) — official Apple CDN

    "accessory-009": "https://m.media-amazon.com/images/I/61e7jKn7VQL._SL1500_.jpg",
    # UGREEN 9-in-1 USB-C Hub — Amazon CDN

    "accessory-010": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MPWU3?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1670623540195",
    # Apple MagSafe Charger 1m — official Apple CDN

    "accessory-011": "https://hybrismediaprod.blob.core.windows.net/sys-master-phoenix-images-container/h9e/h4a/9080999870494/razer-deathadder-essential-500x500.png",
    # Razer DeathAdder Essential — official Razer CDN; use Amazon CDN
    "accessory-011": "https://m.media-amazon.com/images/I/51HNHlwsFRL._SL1500_.jpg",
}

def update_database():
    """Update all product images in PostgreSQL."""
    print("Connecting to database...")
    db = SessionLocal()
    try:
        updated = 0
        failed = []
        for slug, url in IMAGE_MAPPING.items():
            product = db.query(Product).filter(Product.slug == slug).first()
            if product:
                product.image_url = url
                updated += 1
                print(f"  ✓ {slug}: {product.name[:40]}")
            else:
                failed.append(slug)
                print(f"  ✗ NOT FOUND: {slug}")
        
        db.commit()
        print(f"\n✅ Database updated: {updated} products")
        if failed:
            print(f"⚠️  Not found: {failed}")
        return updated, failed
    except Exception as e:
        db.rollback()
        print(f"❌ Database error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("PayNex Product Image Update")
    print(f"Total mappings: {len(IMAGE_MAPPING)}")
    print("=" * 60)
    update_database()
    print("\nDone! Restart backend to serve updated images.")
