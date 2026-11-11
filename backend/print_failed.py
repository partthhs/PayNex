import json

with open("image_verification_results.json", "r") as f:
    data = json.load(f)

failed = [x for x in data if not x['ok']]
print(f"Failed count: {len(failed)}")
for x in failed:
    print(f"{x['slug']:15} | {x['http_status']:3} | {x['name']:35} | {x['image_url']}")
