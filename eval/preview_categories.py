import json

with open("eval/final_ratings.json", "r", encoding="utf-8") as f:
    data = json.load(f)

with open("eval/preview.txt", "w", encoding="utf-8") as out:
    for category in ["safe", "caution", "unsafe"]:
        items = [d for d in data["drugs"] if d["rating"] == category]
        out.write(f"\n=================== {category.upper()} ({len(items)}) ===================\n")
        for it in items[:25]:
            out.write(f"[{it['id']:3d}] {it['generic'][:25]:25s} | {it['pw']}\n")

print("Done writing to eval/preview.txt")
