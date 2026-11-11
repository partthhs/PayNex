import os, sys, urllib.request, ssl, hashlib, psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/paynex')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

MASTER_URL_MAP = {
    # -------------------------------------------------------------
    # SMARTPHONES (12)
    # -------------------------------------------------------------
    "phone-001": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-5g-sm-s921.jpg",
    "phone-002": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg",
    "phone-003": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-5g.jpg",
    "phone-004": "https://rukminim2.flixcart.com/image/480/640/xif0q/mobile/y/2/t/nord-ce4-cph2613-oneplus-resized-original-imahjjxfctxbtt2e.jpeg?q=90",
    "phone-005": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35.jpg",
    "phone-006": "https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-2a.jpg",
    "phone-007": "https://fdn2.gsmarena.com/vv/bigpic/poco-m6-pro.jpg",
    "phone-008": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8a.jpg",
    "phone-009": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-12.jpg",
    "phone-010": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg",
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
    "watch-002": "https://rukminim2.flixcart.com/image/832/832/xif0q/smartwatch/y/c/8/47-wrb-sw-colorfitpulse2max-std-blu-mid-blu-android-ios-noisefit-original-imahgz4hn2zgs5jg.jpeg",
    "watch-003": "https://rukminim3.flixcart.com/image/480/480/xif0q/smartwatch/b/3/d/46-a2166-android-ios-amazfit-yes-original-imaggnftjgttzneb.jpeg?q=90",
    "watch-004": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-watch6.jpg",
    "watch-005": "https://rukmini1.flixcart.com/image/1500/1500/xif0q/shopsy-smartwatch/h/d/6/35-3-android-ios-bsw100-fireboltt-yes-original-imaguxeqtdynqfrd.jpeg?q=70",
    "watch-006": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-watch-2.jpg",
    "watch-007": "https://upload.wikimedia.org/wikipedia/commons/d/df/Forerunner_55_Garmin_Filipinas_shopD.jpg",
    "watch-008": "https://m.media-amazon.com/images/I/61azzUFOE-L._SL1024_QL60_.jpg",
    "watch-009": "https://fdn2.gsmarena.com/vv/bigpic/apple-watch-8se-2022.jpg",
    "watch-010": "https://rukminim3.flixcart.com/image/480/480/xif0q/smartwatch/y/y/b/45-2-90155ap01-android-ios-titan-no-original-imahrwehbphvhmdz.jpeg?q=90",
    "watch-011": "https://rukminim3.flixcart.com/image/480/480/xif0q/smartwatch/y/7/n/-original-imagzbfpwrz8dhzy.jpeg?q=90",

    # -------------------------------------------------------------
    # LAPTOPS (11)
    # -------------------------------------------------------------
    "laptop-001": "https://upload.wikimedia.org/wikipedia/commons/d/dc/MacBook_Air_%28A2681%29_front.jpg",
    "laptop-002": "https://rukminim3.flixcart.com/image/480/480/k0lbdzk0/computer/d/f/y/dell-na-original-imafkcr7nycv4fws.jpeg?q=90",
    "laptop-003": "https://rukminim3.flixcart.com/image/480/480/xif0q/computer/s/u/v/ideapad-slim-3-15amn8-thin-and-light-laptop-lenovo-original-imahew88hpzvmtfb.jpeg?q=90",
    "laptop-004": "https://rukminim3.flixcart.com/image/480/480/xif0q/computer/i/n/s/-original-imahg4v5zbx9zv29.jpeg?q=80",
    "laptop-005": "https://upload.wikimedia.org/wikipedia/commons/2/2b/HP_Pavilion_%28laptop%29.jpg",
    "laptop-006": "https://rukminim3.flixcart.com/image/480/480/xif0q/computer/g/l/u/-enriched-transparent-original-imahg5fxzqngdhnf.png?q=90",
    "laptop-007": "https://rukminim3.flixcart.com/image/480/480/xif0q/computer/r/l/n/-original-imahn6vwesuegyn8.jpeg?q=90",
    "laptop-008": "https://rukminim3.flixcart.com/image/480/480/xif0q/computer/h/w/b/-original-imagtzvhxxuhzr4g.jpeg?q=90",
    "laptop-009": "https://rukminim2.flixcart.com/image/480/640/xif0q/computer/m/f/0/-original-imaguw3hswqadydy.jpeg?q=90",
    "laptop-010": "https://rukminim3.flixcart.com/image/480/480/xif0q/computer/r/c/a/-enriched-transparent-original-imahg534shtdj5zf.png?q=90",
    "laptop-011": "https://rukminim3.flixcart.com/image/480/640/xif0q/computer/g/4/3/-original-imahjy5ayazwh6qh.jpeg?q=20",

    # -------------------------------------------------------------
    # CAMERAS (11)
    # -------------------------------------------------------------
    "camera-001": "https://rukminim3.flixcart.com/image/480/480/xif0q/dslr-camera/v/y/w/eos-r50-24-2-r50-canon-original-imagngchyb9skcq2.jpeg?q=90",
    "camera-002": "https://upload.wikimedia.org/wikipedia/commons/b/ba/Sony_ZV-E10_with_Sony_E_16-50mm_F3.5-5.6_OSS_PZ_-_by_Henry_S%C3%B6derlund_%2851375243603%29.jpg",
    "camera-003": "https://rukminim3.flixcart.com/image/480/480/xif0q/sports-action-camera/y/r/u/-enriched-transparent-original-imahyxtgj2g8uqvn.png?q=90",
    "camera-004": "https://rukminim3.flixcart.com/image/480/640/xif0q/sports-action-camera/f/b/a/osmo-pocket-3-osmo-2-64-pocket-3-dji-original-imaguzhfz5z4xphr.jpeg?q=90",
    "camera-005": "https://rukminim3.flixcart.com/image/480/480/xif0q/dslr-camera/r/w/n/-original-imagvjzkefuavj7g.jpeg?q=90",
    "camera-006": "https://rukmini1.flixcart.com/image/1500/1500/ky3b0y80/dslr-camera/o/m/p/x-t30-ii-mirrorless-camera-body-silver-26-1-x-t30iibody-silver-original-imagaegu2udhejrq.jpeg?q=70",
    "camera-007": "https://rukminim3.flixcart.com/image/480/480/xif0q/dslr-camera/m/a/n/z-50-20-9-z-50-nikon-original-imah3gapgggqhbma.jpeg?q=90",
    "camera-008": "https://rukminim3.flixcart.com/image/480/480/xif0q/sports-action-camera/x/r/b/-enriched-transparent-original-imaggehemn9ykvuv.png?q=90",
    "camera-009": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Canon_PowerShot_V10_-_1.jpg",
    "camera-010": "https://rukminim2.flixcart.com/image/480/480/jn97frk0/dslr-camera/g/z/e/lumix-g-7-panasonic-original-imaf9zcrwjxhmzam.jpeg?q=90",
    "camera-011": "https://rukminim3.flixcart.com/image/480/640/xif0q/instant-camera/p/r/c/-original-imahprkgp7kzfvw6.jpeg?q=90",

    # -------------------------------------------------------------
    # HEADPHONES (11)
    # -------------------------------------------------------------
    "headphones-001": "https://rukminim3.flixcart.com/image/480/640/xif0q/headphone/o/g/7/-original-imahgr29hqgfsmww.jpeg?q=90",
    "headphones-002": "https://rukminim3.flixcart.com/image/480/640/xif0q/headphone/s/t/m/-original-imaghxgnjdgyghfw.jpeg?q=90",
    "headphones-003": "https://rukminim3.flixcart.com/image/480/640/xif0q/headphone/q/m/x/-original-imahqcny6umkqf8h.jpeg?q=90",
    "headphones-004": "https://rukminim2.flixcart.com/image/480/640/xif0q/headphone/h/y/r/-original-imagzkazemccdfdj.jpeg?q=80",
    "headphones-005": "https://cdn.jiostore.online/v2/jmd-asp/jdprod/wrkr/products/pictures/item/free/resize-w:460/sony/493841804/2/7rxUH9OY5a-9r1uazuMAy-Sony-BT-HP-WH-CH520-White-493841804-i-3-1200Wx1200H.jpeg",
    "headphones-006": "https://rukminim3.flixcart.com/image/480/480/xif0q/headphone/z/n/n/-enriched-transparent-original-imagsjzc93u5eskr.png?q=90",
    "headphones-007": "https://rukminim3.flixcart.com/image/480/640/xif0q/headphone/m/e/a/-original-imahpsh48gghzm7h.jpeg?q=90",
    "headphones-008": "https://rukminim3.flixcart.com/image/480/640/l3t2fm80/headphone/o/l/3/quietcomfort-45-bose-original-imageuhwmwhh9cqn.jpeg?q=90",
    "headphones-009": "https://rukminim3.flixcart.com/image/480/640/kz4gh3k0/headphone/y/q/v/-original-imagb7g9h6cfxfh9.jpeg?q=90",
    "headphones-010": "https://rukminim3.flixcart.com/image/480/640/xif0q/headphone/j/a/7/-original-imahfeygh2qpvgsx.jpeg?q=90",
    "headphones-011": "https://rukminim3.flixcart.com/image/480/480/xif0q/headphone/z/4/g/wf-1000xm5-sony-enriched-transparent-original-imagtakf5q7dwhet.png?q=90",

    # -------------------------------------------------------------
    # SPEAKERS (11)
    # -------------------------------------------------------------
    "speaker-001": "https://rukminim3.flixcart.com/image/480/480/xif0q/speaker/n/x/j/-enriched-transparent-original-imahdxtp8hg7zb4z.png?q=90",
    "speaker-002": "https://rukminim3.flixcart.com/image/480/640/xif0q/speaker/u/f/i/-original-imahqcnyabcqhegg.jpeg?q=90",
    "speaker-003": "https://rukminim3.flixcart.com/image/480/640/kljrvrk0/speaker/mobile-tablet-speaker/y/v/i/go3blk-jbl-original-imagymz3wtgmzpas.jpeg?q=20",
    "speaker-004": "https://rukminim3.flixcart.com/image/480/480/xif0q/speaker/k/c/a/-enriched-transparent-original-imagzeffzq2zntg4.png?q=90",
    "speaker-005": "https://rukminim3.flixcart.com/image/480/480/xif0q/speaker/q/0/k/-enriched-transparent-original-imagrc9huqenzmsf.png?q=90",
    "speaker-006": "https://rukminim3.flixcart.com/image/480/480/l44hyfk0/speaker/party-speaker/y/u/3/soundlink-flex-bose-original-imagf39why9hwyz9.jpeg?q=90",
    "speaker-007": "http://tribit.com/cdn/shop/files/micro.png",
    "speaker-008": "https://rukminim3.flixcart.com/image/480/480/xif0q/speaker/9/9/k/-original-imah3gaktfahzxqj.jpeg?q=90",
    "speaker-009": "https://rukminim3.flixcart.com/image/480/480/xif0q/speaker/j/y/w/-enriched-transparent-original-imaggqm3uvfkzjfa.png?q=90",
    "speaker-010": "https://rukminim3.flixcart.com/image/480/480/xif0q/speaker/w/a/9/-original-imagtr59hxnbaphc.jpeg?q=90",
    "speaker-011": "https://rukminim3.flixcart.com/image/300/300/xif0q/speaker/party-speaker/v/9/x/srs-xg300-sony-original-imaghngdn7gny5ny.jpeg",

    # -------------------------------------------------------------
    # ACCESSORIES (11)
    # -------------------------------------------------------------
    "accessory-001": "https://rukminim3.flixcart.com/image/300/300/xif0q/mouse/k/q/2/-original-imagzjd7qsrwsghc.jpeg",
    "accessory-002": "https://rukminim3.flixcart.com/image/480/640/xif0q/keyboard/multi-device-keyboard/y/x/q/k2-wireless-aluminum-hot-swappable-mechanical-keyboard-keychron-original-imags7n74bmyqfja.jpeg?q=20",
    "accessory-003": "https://rukminim3.flixcart.com/image/480/480/xif0q/keyboard/2/x/m/-enriched-transparent-original-imahbg3zanfhjqct.png?q=90",
    "accessory-004": "https://www.notebookcheck.net/fileadmin/Notebooks/News/_nc3/Anker_735_GaN_charger.jpg",
    "accessory-005": "https://rukminim2.flixcart.com/image/480/640/xif0q/external-hard-drive/j/a/x/-original-imahfh6m7gcxh9tz.jpeg?q=90",
    "accessory-006": "https://rukminim3.flixcart.com/image/480/640/xif0q/webcam/u/e/z/-original-imah2hcgvzbnytaa.jpeg?q=90",
    "accessory-007": "https://rukminim3.flixcart.com/image/480/480/xif0q/battery-charger/m/1/o/-enriched-transparent-original-imagmmsp9bjftejs.png?q=90",
    "accessory-008": "https://rukminim3.flixcart.com/image/300/300/xif0q/mouse/4/w/q/-original-imahg5k9kgstpvjw.jpeg",
    "accessory-009": "https://rukminim3.flixcart.com/image/480/640/xif0q/docking-station/c/m/h/1-80133-ugreen-original-imagmhu6bhagaxja.jpeg?q=90",
    "accessory-010": "https://rukminim3.flixcart.com/image/480/640/kgqvlow0/charging-pad/h/3/z/magsafe-charger-mhxh3zm-a-apple-original-imafwwwav9zhpuwn.jpeg?q=90",
    "accessory-011": "https://rukminim3.flixcart.com/image/480/640/kwmfqfk0/mouse/k/x/s/deathadder-essential-ergonomic-6400-dpi-rz01-03850100-r3m1-razer-original-imag99gqmkdy4ygj.jpeg?q=90",
}

def download_image(slug, url):
    ext = ".jpg"
    clean_url = url.split("?")[0].lower()
    if clean_url.endswith(".png"): ext = ".png"
    elif clean_url.endswith(".webp"): ext = ".webp"
    elif clean_url.endswith(".jpeg"): ext = ".jpeg"
    
    filename = f"{slug}{ext}"
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
        if resp.status != 200:
            raise Exception(f"HTTP {resp.status}")
        data = resp.read()
        if len(data) < 2000:
            raise Exception(f"File too small ({len(data)} bytes)")
        
        # Verify valid image header
        header = data[:16]
        is_valid_img = (
            header.startswith(b'\xff\xd8\xff') or # JPEG
            header.startswith(b'\x89PNG\r\n\x1a\n') or # PNG
            (header.startswith(b'RIFF') and b'WEBP' in header) # WEBP
        )
        if not is_valid_img:
            raise Exception(f"Invalid image format header: {header[:8]}")
            
        with open(filepath, "wb") as f:
            f.write(data)
            
        md5_hash = hashlib.md5(data).hexdigest()
        return filename, len(data), md5_hash

def main():
    print(f"Starting download and verification of all {len(MASTER_URL_MAP)} products...")
    results = {}
    failed = []
    
    for idx, (slug, url) in enumerate(MASTER_URL_MAP.items(), 1):
        try:
            filename, size, h = download_image(slug, url)
            results[slug] = (filename, size, h)
            print(f"[{idx:02d}/89] OK: {slug} -> {filename} ({size} B, hash {h[:8]}...)")
        except Exception as e:
            failed.append((slug, url, str(e)))
            print(f"[{idx:02d}/89] ERROR: {slug} -> {e}")
            
    if failed:
        print(f"\n[!] {len(failed)} downloads failed:")
        for f in failed:
            print(f"  - {f[0]}: {f[2]}")
        return
        
    # Check duplicate hashes
    by_hash = {}
    for slug, (fn, sz, h) in results.items():
        by_hash.setdefault(h, []).append(slug)
        
    duplicates = {h: s for h, s in by_hash.items() if len(s) > 1}
    if duplicates:
        print(f"\n[!] Warning: Found {len(duplicates)} duplicate hash groups:")
        for h, slugs in duplicates.items():
            print(f"  Hash {h}: {slugs}")
    else:
        print(f"\n[SUCCESS] ALL {len(results)} PRODUCTS HAVE 100% UNIQUE IMAGES (0 duplicate hashes)!")
        
    # Update Database
    print("\nUpdating PostgreSQL database...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    updated_count = 0
    for slug, (fn, sz, h) in results.items():
        new_url = f"http://localhost:8000/static/images/{fn}"
        cur.execute("UPDATE products SET image_url = %s WHERE slug = %s;", (new_url, slug))
        updated_count += cur.rowcount
    conn.commit()
    conn.close()
    print(f"[SUCCESS] Updated {updated_count} product image records in PostgreSQL.")

if __name__ == "__main__":
    main()
