import json

with open("eval/classification_results.json", "r", encoding="utf-8") as f:
    res = json.load(f)

with open("eval/samples_preview.txt", "w", encoding="utf-8") as out:
    out.write(f"=== UNSAFE SAMPLE (Total: {len(res['unsafe'])}) ===\n")
    for item in res["unsafe"][:15]:
        out.write(f"[{item['id']}] {item['generic']}: {item['pw']}\n")

    out.write(f"\n=== SAFE SAMPLE (Total: {len(res['safe'])}) ===\n")
    for item in res["safe"][:15]:
        out.write(f"[{item['id']}] {item['generic']}: {item['pw']}\n")

    out.write(f"\n=== CAUTION SAMPLE (Total: {len(res['caution'])}) ===\n")
    for item in res["caution"][:15]:
        out.write(f"[{item['id']}] {item['generic']}: {item['pw']}\n")

print("Wrote preview to eval/samples_preview.txt")
