"""
Resolve failed image URLs using Wikimedia Commons API and exact search.
"""
import urllib.request
import urllib.parse
import json
import time

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}
WIKI_HEADERS = {
    'User-Agent': 'PayNexAuditBot/1.0 (https://paynex.local; contact@paynex.local)'
}

def check_url(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.status == 200
    except:
        return False

def search_wikimedia(query):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&srnamespace=6&format=json&srlimit=5"
    try:
        req = urllib.request.Request(url, headers=WIKI_HEADERS)
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            results = data.get('query', {}).get('search', [])
            return [res['title'] for res in results]
    except Exception as e:
        return []

def get_wikimedia_url(file_title):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(file_title)}&prop=imageinfo&iiprop=url&format=json"
    try:
        req = urllib.request.Request(url, headers=WIKI_HEADERS)
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            pages = data.get('query', {}).get('pages', {})
            for pid, pdata in pages.items():
                infos = pdata.get('imageinfo', [])
                if infos:
                    raw_url = infos[0].get('url', '')
                    return raw_url.split('?')[0]
    except Exception as e:
        return None
    return None

def main():
    with open("image_verification_results.json", "r") as f:
        data = json.load(f)
    
    failed = [x for x in data if not x['ok']]
    print(f"Total failed: {len(failed)}")
    
    resolved = {}
    for item in failed:
        slug = item['slug']
        name = item['name']
        brand = item['brand']
        
        # queries to try
        queries = [
            f"{brand} {name}",
            name,
            f"{name} camera" if "camera" in slug else f"{name} laptop" if "laptop" in slug else name
        ]
        
        found = None
        for q in queries:
            titles = search_wikimedia(q)
            for t in titles:
                # Filter out irrelevant files (like certificates, logos, unrelated SVGs)
                tl = t.lower()
                if any(ext in tl for ext in ['.jpg', '.jpeg', '.png', '.webp']) and not any(skip in tl for skip in ['logo', 'icon', 'advertisement', 'board', 'banner']):
                    url = get_wikimedia_url(t)
                    if url and check_url(url):
                        found = (t, url)
                        break
            if found:
                break
            time.sleep(0.3)
        
        if found:
            print(f"✅ FOUND for {slug} ({name}): {found[0]}")
            print(f"   -> {found[1]}")
            resolved[slug] = found[1]
        else:
            print(f"❌ NOT FOUND on Wikimedia: {slug} ({name})")
    
    with open("wikimedia_resolved.json", "w") as f:
        json.dump(resolved, f, indent=2)
    print(f"\nResolved {len(resolved)} / {len(failed)} via Wikimedia Commons!")

if __name__ == '__main__':
    main()
