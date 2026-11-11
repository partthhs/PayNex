"""
Comprehensive update for all 89 PayNex products.
Combines GSMArena CDN, verified Wikimedia Commons, verified brand CDNs, and verified Unsplash.
Every single image is tested for HTTP 200 before applying.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import urllib.request
import json
from app.database import SessionLocal
from app.models import Product

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

def test_url(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.status == 200
    except:
        return False

# Mapping of all 89 products to verified, reliable image URLs
FULL_IMAGE_MAP = {
    # -------------------------------------------------------------
    # SMARTPHONES (12)
    # -------------------------------------------------------------
    "phone-001": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-5g-sm-s921.jpg",
    "phone-002": "https://upload.wikimedia.org/wikipedia/commons/1/19/Apple_iPhone_15_Pro.jpg",
    "phone-003": "https://fdn2.gsmarena.com/vv/bigpic/redmi-note-13.jpg",
    "phone-004": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-ce-4.jpg",
    "phone-005": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35.jpg",
    "phone-006": "https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-2a.jpg",
    "phone-007": "https://fdn2.gsmarena.com/vv/bigpic/poco-m6-pro.jpg",
    "phone-008": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8a.jpg",
    "phone-009": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-12.jpg",
    "phone-010": "https://m.media-amazon.com/images/I/71657TiFeHL._SL1500_.jpg",
    "phone-011": "https://fdn2.gsmarena.com/vv/bigpic/motorola-edge50-pro.jpg",
    "phone-012": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-fe.jpg",

    # -------------------------------------------------------------
    # TABLETS (11)
    # -------------------------------------------------------------
    "tablet-001": "https://fdn2.gsmarena.com/vv/bigpic/apple-ipad-air-11-2024.jpg",
    "tablet-002": "https://fdn2.gsmarena.com/vv/bigpic/lenovo-tab-m11.jpg",
    "tablet-003": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-pad6.jpg",
    "tablet-004": "https://upload.wikimedia.org/wikipedia/commons/0/0f/IPad_10.png",
    "tablet-005": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-tab-s9-fe-10-.jpg",
    "tablet-006": "https://fdn2.gsmarena.com/vv/bigpic/realme-pad2.jpg",
    "tablet-007": "https://fdn2.gsmarena.com/vv/bigpic/lenovo-tab-m9.jpg",
    "tablet-008": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-pad-go.jpg",
    "tablet-009": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-tab-s9-ultra-5g.jpg",
    "tablet-010": "https://fdn2.gsmarena.com/vv/bigpic/apple-ipad-pro-11-2024.jpg",
    "tablet-011": "https://fdn2.gsmarena.com/vv/bigpic/nokia-t21.jpg",

    # -------------------------------------------------------------
    # SMARTWATCHES (11)
    # -------------------------------------------------------------
    "watch-001": "https://fdn2.gsmarena.com/vv/bigpic/apple-watch-series9.jpg",
    "watch-002": "https://www.gonoise.com/cdn/shop/products/Artboard3-min.png?v=1669869991",
    "watch-003": "https://upload.wikimedia.org/wikipedia/commons/5/52/AmazfitBand7.jpg",
    "watch-004": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-watch6.jpg",
    "watch-005": "https://www.fireboltt.com/cdn/shop/files/B0BRKXXPZ7.MAIN_400x.jpg",
    "watch-006": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-watch-2.jpg",
    "watch-007": "https://upload.wikimedia.org/wikipedia/commons/9/95/Garmin_Forerunner_55.jpg",
    "watch-008": "https://m.media-amazon.com/images/I/61H8ziYOt6L._SL1500_.jpg",
    "watch-009": "https://fdn2.gsmarena.com/vv/bigpic/apple-watch-8se-2022.jpg",
    "watch-010": "https://upload.wikimedia.org/wikipedia/commons/5/5d/TITAN_watch.jpg",
    "watch-011": "https://upload.wikimedia.org/wikipedia/commons/0/00/Garmin_Fenix_6x_Pro_Solar.jpg",

    # -------------------------------------------------------------
    # LAPTOPS (11)
    # -------------------------------------------------------------
    "laptop-001": "https://upload.wikimedia.org/wikipedia/commons/d/dc/MacBook_Air_%28A2681%29_front.jpg",
    "laptop-002": "https://upload.wikimedia.org/wikipedia/commons/d/df/Dell_XPS_15_%282017%29.png",
    "laptop-003": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Lenovo_Ideapad_3_20240401_121836.jpg",
    "laptop-004": "https://upload.wikimedia.org/wikipedia/commons/0/05/Vivobook_S16.jpg",
    "laptop-005": "https://upload.wikimedia.org/wikipedia/commons/2/2b/HP_Pavilion_%28laptop%29.jpg",
    "laptop-006": "https://upload.wikimedia.org/wikipedia/commons/3/31/Acer_Swift_3_SF314-56-52CP%2C_Expert_Veendam_%282020%29_01.jpg",
    "laptop-007": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Aspire_Lite_14_2025.jpg",
    "laptop-008": "https://upload.wikimedia.org/wikipedia/commons/5/57/ASUS_TUF_Gaming_5_Pro_Laptop.jpg",
    "laptop-009": "https://upload.wikimedia.org/wikipedia/commons/5/58/M3_Macbook_Pro_14_inch_Space_Grey_model_%28cropped%29.jpg",
    "laptop-010": "https://upload.wikimedia.org/wikipedia/commons/4/48/Lenovo_Yoga_2_Pro_%28Silver_Gray%29.jpg",
    "laptop-011": "https://upload.wikimedia.org/wikipedia/commons/6/67/HP_Victus_15_gaming_laptop_side_view.jpg",

    # -------------------------------------------------------------
    # CAMERAS (11)
    # -------------------------------------------------------------
    "camera-001": "https://upload.wikimedia.org/wikipedia/commons/6/62/Canon_EOS_R50_Black.jpg",
    "camera-002": "https://upload.wikimedia.org/wikipedia/commons/b/ba/Sony_ZV-E10_with_Sony_E_16-50mm_F3.5-5.6_OSS_PZ_-_by_Henry_S%C3%B6derlund_%2851375243603%29.jpg",
    "camera-003": "https://upload.wikimedia.org/wikipedia/commons/a/a8/GoPro_Hero_8_Black_and_Hero_11_Black.JPG",
    "camera-004": "https://upload.wikimedia.org/wikipedia/commons/0/06/DJI_Osmo_Pocket_3_-_1.jpg",
    "camera-005": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Sony_Alpha_7_Mark_IV.jpg",
    "camera-006": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Fujifilm_X-T30_II.jpg",
    "camera-007": "https://upload.wikimedia.org/wikipedia/commons/8/86/Nikon_Z_50_0.jpg",
    "camera-008": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Insta360_X4.jpg",
    "camera-009": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Canon_PowerShot_V10_-_4.jpg",
    "camera-010": "https://upload.wikimedia.org/wikipedia/commons/c/ce/Panasonic_Lumix_DMC-G7M.jpg",
    "camera-011": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Fujifilm_Instax_Mini_12_-_Instant_Film_Camera_%2852950271338%29.jpg",

    # -------------------------------------------------------------
    # HEADPHONES (11)
    # -------------------------------------------------------------
    "headphones-001": "https://images.unsplash.com/photo-1662948261149-3f0a0ab0181b?auto=format&fit=crop&w=800&q=80",
    "headphones-002": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1660803972361",
    "headphones-003": "https://www.boat-lifestyle.com/cdn/shop/products/eb8e0fbd-c412-48b3-9c91-5b49ddf35800.png",
    "headphones-004": "https://upload.wikimedia.org/wikipedia/commons/5/52/Samsung_Galaxy_Buds2.jpg",
    "headphones-005": "https://upload.wikimedia.org/wikipedia/commons/0/01/Sony_WH-CH510_Bluetooth_Over-Ear_Headphone.jpg",
    "headphones-006": "https://upload.wikimedia.org/wikipedia/commons/f/f8/Sony_WF-1000XM4.jpg",
    "headphones-007": "https://www.boat-lifestyle.com/cdn/shop/files/AD141-FI_Black06_600x.jpg?v=1722247855",
    "headphones-008": "https://upload.wikimedia.org/wikipedia/commons/d/d6/Bose_QuietComfort_35_II_Wireless_Headphones.jpg",
    "headphones-009": "https://upload.wikimedia.org/wikipedia/commons/c/c4/JBL_LIVE_650_BTNC_%28Over-Ear_Noise_Cancelling_Headphone%29._%2851127342181%29.jpg",
    "headphones-010": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    "headphones-011": "https://upload.wikimedia.org/wikipedia/commons/f/f8/Sony_WF-1000XM4.jpg",

    # -------------------------------------------------------------
    # SPEAKERS (11)
    # -------------------------------------------------------------
    "speaker-001": "https://upload.wikimedia.org/wikipedia/commons/a/a2/JBL_Flip_4.jpg",
    "speaker-002": "https://www.boat-lifestyle.com/cdn/shop/files/original-imageh8fshjw4khu_1024x.webp?v=1686204371",
    "speaker-003": "https://upload.wikimedia.org/wikipedia/commons/2/24/Speaker_JBL_GO.jpg",
    "speaker-004": "https://upload.wikimedia.org/wikipedia/commons/c/c6/Marshall%2C_IFA_2018%2C_Berlin_%28P1070104%29.jpg",
    "speaker-005": "https://upload.wikimedia.org/wikipedia/commons/5/54/Tribit_MaxBoom_Bluetooth_Speaker.jpg",
    "speaker-006": "https://upload.wikimedia.org/wikipedia/commons/b/ba/Bose_SoundLink_Flex_Bluetooth%C2%AE_Speaker_%28white%29.jpeg",
    "speaker-007": "https://upload.wikimedia.org/wikipedia/commons/5/54/Tribit_MaxBoom_Bluetooth_Speaker.jpg",
    "speaker-008": "https://upload.wikimedia.org/wikipedia/commons/c/c6/Marshall%2C_IFA_2018%2C_Berlin_%28P1070104%29.jpg",
    "speaker-009": "https://upload.wikimedia.org/wikipedia/commons/3/33/JBL_Charge_4_1v2.jpg",
    "speaker-010": "https://www.boat-lifestyle.com/cdn/shop/products/main---1.png?v=1640081208",
    "speaker-011": "https://upload.wikimedia.org/wikipedia/commons/3/33/JBL_Charge_4_1v2.jpg",

    # -------------------------------------------------------------
    # ACCESSORIES (11)
    # -------------------------------------------------------------
    "accessory-001": "https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-top-view-graphite.png",
    "accessory-002": "https://upload.wikimedia.org/wikipedia/commons/a/aa/Keychron_K4_mechanical_keyboard.jpg",
    "accessory-003": "https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/keyboards/pebble-keys-2-k380s/gallery/pebble-keys-2-k380s-keyboard-top-view-tonal-graphite.png",
    "accessory-004": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Silicon_vs_GaN_30W_USB-C_chargers.jpg",
    "accessory-005": "https://upload.wikimedia.org/wikipedia/commons/7/7c/SanDisk_Extreme_Portable_SSD_1_TB_-_front_view.jpg",
    "accessory-006": "https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/webcams/c920s/gallery/c920s-hd-pro-webcam-gallery-1.png",
    "accessory-007": "https://www.boat-lifestyle.com/cdn/shop/products/main_b644bc3a-684b-4252-be8d-6b7f01579ecf.png?v=1643021387",
    "accessory-008": "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MMMQ3?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1646689365000",
    "accessory-009": "https://upload.wikimedia.org/wikipedia/commons/7/76/USB-C_Hubb_5_portar.jpg",
    "accessory-010": "https://upload.wikimedia.org/wikipedia/commons/0/01/MagSafe_and_USB-C_Cable_Charger_for_iPhone.jpg",
    "accessory-011": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Razer_Deathadder.JPG",
}

print(f"Total mappings to apply: {len(FULL_IMAGE_MAP)}")

db = SessionLocal()
products = db.query(Product).all()
updated_count = 0
failed_test = []

for p in products:
    new_url = FULL_IMAGE_MAP.get(p.slug)
    if new_url:
        ok = test_url(new_url)
        status_icon = "✅" if ok else "❌"
        print(f"{status_icon} [{p.slug}] {p.name[:30]} -> {new_url[:60]}...")
        if ok:
            p.image_url = new_url
            updated_count += 1
        else:
            failed_test.append((p.slug, new_url))

db.commit()
db.close()

print(f"\nCompleted! {updated_count} / {len(FULL_IMAGE_MAP)} verified and updated in DB.")
if failed_test:
    print(f"Failed to load: {failed_test}")
