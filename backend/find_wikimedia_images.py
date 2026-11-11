"""
Discover Wikimedia Commons images for products
"""
import urllib.request
import json
import time

HEADERS = {
    'User-Agent': 'PayNexAuditBot/1.0 (https://paynex.local; contact@paynex.local)'
}

def search_wikimedia(query):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&srnamespace=6&format=json&srlimit=5"
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            results = data.get('query', {}).get('search', [])
            return [res['title'] for res in results]
    except Exception as e:
        return []

def get_image_url(file_title):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(file_title)}&prop=imageinfo&iiprop=url&format=json"
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            pages = data.get('query', {}).get('pages', {})
            for pid, pdata in pages.items():
                infos = pdata.get('imageinfo', [])
                if infos:
                    raw_url = infos[0].get('url', '')
                    # strip query params
                    return raw_url.split('?')[0]
    except Exception as e:
        return None
    return None

if __name__ == '__main__':
    test_queries = [
        "Dell XPS 15",
        "Sony WH-1000XM5",
        "Canon EOS R50",
        "GoPro HERO12",
        "JBL Flip 6",
        "Logitech MX Master",
        "Apple Watch Series 9",
        "Fujifilm X-T30",
        "Google Pixel 8a"
    ]
    for q in test_queries:
        titles = search_wikimedia(q)
        print(f"\nQuery: {q}")
        for t in titles[:2]:
            img_url = get_image_url(t)
            print(f"  -> {t} : {img_url}")
        time.sleep(0.5)
