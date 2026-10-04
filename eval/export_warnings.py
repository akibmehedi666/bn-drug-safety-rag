import json

with open("data/drugs_corpus.json", "r", encoding="utf-8") as f:
    drugs = json.load(f)

warnings = []
for d in drugs:
    warnings.append({
        "id": d["id"],
        "name": d["name"],
        "generic": d.get("generic_name", ""),
        "brand": d.get("brand_names", ""),
        "pw": d.get("pregnancy_warning", ""),
        "contra": d.get("contraindications", "")
    })

with open("eval/all_pregnancy_warnings.json", "w", encoding="utf-8") as out:
    json.dump(warnings, out, ensure_ascii=False, indent=2)

print(f"Exported {len(warnings)} warnings to eval/all_pregnancy_warnings.json")
