import json

with open("data/drugs_corpus.json", "r", encoding="utf-8") as f:
    corpus = json.load(f)

with open("eval/all_generics.txt", "w", encoding="utf-8") as out:
    for d in corpus:
        cid = d.get("id", "")
        gen = d.get("generic_name", "")
        bn = d.get("bangla_name", "")
        brand = d.get("brand_names", "")
        cat = d.get("category", "")
        out.write(f"[{cid:3d}] Gen: {gen:30s} | Bn: {bn:30s} | Brand: {brand:25s} | Cat: {cat}\n")

print(f"Exported {len(corpus)} generics to eval/all_generics.txt")
