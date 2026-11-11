import urllib.request

test_slugs = ['laptop-002.jpeg', 'camera-001.jpeg', 'headphones-001.jpeg', 'speaker-001.png', 'watch-003.jpeg', 'accessory-001.jpeg', 'tablet-004.jpeg', 'camera-005.jpeg', 'speaker-003.jpeg', 'headphones-005.jpeg', 'watch-011.jpeg', 'laptop-009.jpeg']
ok = 0
for f in test_slugs:
    url = 'http://localhost:8000/static/images/' + f
    try:
        r = urllib.request.urlopen(url, timeout=4)
        ct = r.headers.get('Content-Type', '?')
        cl = r.headers.get('Content-Length', '?')
        print('OK', f, '->', r.status, 'type:', ct, 'size:', cl)
        ok += 1
    except Exception as e:
        print('FAIL', f, '->', e)
print('\n{}/{} serving OK'.format(ok, len(test_slugs)))
