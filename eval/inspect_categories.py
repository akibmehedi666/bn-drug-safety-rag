import json
import re

with open("data/drugs_corpus.json", "r", encoding="utf-8") as f:
    drugs = json.load(f)

print(f"Loaded {len(drugs)} drugs.")

categories = {}
for d in drugs:
    cat = d.get("category", "General")
    categories[cat] = categories.get(cat, 0) + 1

for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
    print(f"{cat}: {count}")
