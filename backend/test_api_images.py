import urllib.request, json
url = 'http://localhost:8000/api/v1/products?page_size=12'
with urllib.request.urlopen(url, timeout=5) as r:
    data = json.loads(r.read())
    items = data.get('items', [])
    print('Got', len(items), 'items')
    for p in items:
        slug = p.get('slug', '')
        name = p.get('name', '')
        img = p.get('image_url', '')
        is_local = img.startswith('http://localhost:8000/static/images/')
        marker = 'OK' if is_local else 'STALE'
        print(marker, slug, '->', img)
