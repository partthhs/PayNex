import os, urllib.request, ssl, hashlib, psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
DATABASE_URL = os.getenv('DATABASE_URL')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'}
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "images")

FIXES = {
    "watch-007": "https://rukminim2.flixcart.com/image/612/612/xif0q/smartwatch/z/2/t/-original-imah8ey9q95rbndf.jpeg?q=70",
    "camera-002": "https://rukminim3.flixcart.com/image/480/480/ktlu9ow0/dslr-camera/y/e/h/alpha-zv-e10-24-2-megapixel-with-interchangeable-lens-aps-c-original-imag6wxfytmvjw7a.jpeg?q=90",
    "camera-009": "https://rukminim3.flixcart.com/image/480/640/xif0q/point-shoot-camera/i/6/z/powershot-v10-powershot-2-15-2-v10-canon-original-imagr2ceftzyxtzy.jpeg?q=90",
}

results = {}
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

for slug, url in FIXES.items():
    ext = ".jpeg"
    filename = f"{slug}{ext}"
    filepath = os.path.join(OUTPUT_DIR, filename)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            data = resp.read()
            if len(data) < 2000:
                raise Exception(f"Too small: {len(data)} bytes")
            header = data[:8]
            if not (header.startswith(b'\xff\xd8\xff') or header.startswith(b'\x89PNG')):
                raise Exception(f"Invalid image header: {header[:4]}")
            with open(filepath, 'wb') as f:
                f.write(data)
            h = hashlib.md5(data).hexdigest()
            new_url = f"http://localhost:8000/static/images/{filename}"
            cur.execute("UPDATE products SET image_url = %s WHERE slug = %s;", (new_url, slug))
            print(f"OK: {slug} -> {filename} ({len(data)} B, hash {h[:8]}...) -> DB updated {cur.rowcount} row(s)")
    except Exception as e:
        print(f"ERROR: {slug} -> {e}")

conn.commit()
conn.close()

# Final duplicate check
print("\n--- Final duplicate hash audit ---")
import psycopg2
conn2 = psycopg2.connect(DATABASE_URL)
cur2 = conn2.cursor()
cur2.execute("SELECT slug, image_url FROM products ORDER BY id;")
rows = cur2.fetchall()
conn2.close()

by_hash = {}
for slug, img_url in rows:
    fname = img_url.split('/')[-1]
    fpath = os.path.join(OUTPUT_DIR, fname)
    if os.path.exists(fpath):
        h = hashlib.md5(open(fpath, 'rb').read()).hexdigest()
        by_hash.setdefault(h, []).append(slug)
    else:
        print(f"  MISSING FILE: {slug} -> {fpath}")

dups = {h: s for h, s in by_hash.items() if len(s) > 1}
if dups:
    print(f"[!] {len(dups)} duplicate hash groups still found:")
    for h, slugs in dups.items():
        print(f"  {h[:8]}: {slugs}")
else:
    print(f"[SUCCESS] 0 duplicate images. All {len(rows)} products have unique images!")
