import json

with open("data/drugs_corpus.json", "r", encoding="utf-8") as f:
    drugs = json.load(f)

def get_clinical_rating(pw_str, contra_str=""):
    pw = (pw_str or "").lower()
    
    # 1. Definite UNSAFE / CONTRAINDICATED IN PREGNANCY
    # Patterns like: "contraindicated", "নিষিদ্ধ", "এড়িয়ে চলুন", "বর্জনীয়", "teratogenic", "ভ্রূণের ক্ষতি", "মারাত্মক ঝুঁকি"
    # Note: watch out for "তৃতীয় ত্রৈমাসিকে এড়িয়ে চলুন" -> unsafe / caution
    
    if any(k in pw for k in [
        "contraindicated", "সম্পূর্ণ নিষিদ্ধ", "গর্ভকালীন ব্যবহার নিষিদ্ধ", "কখনই নয়",
        "teratogenic", "টেরাটোজেনিক", "ভ্রূণের মারাত্মক", "জন্মগত ত্রুটি", "ভ্রূণহানি",
        "category x", "ক্যাটাগরি এক্স", "category d", "ক্যাটাগরি ডি",
        "do not use in pregnancy", "avoid throughout pregnancy", "contraindicated in pregnancy"
    ]):
        return "unsafe"
        
    # Specific known unsafe drugs or warnings
    if any(k in pw for k in [
        "এড়িয়ে চলুন", "avoid in 3rd trimester", "avoid in pregnancy", "বর্জনীয়",
        "ঝুঁকিপূর্ণ", "ক্ষতিকর প্রভাব", "মারাত্মক", "strictly avoid", "not recommended",
        "ভ্রূণের ক্ষতি হতে পারে", "ভ্রূণের ক্ষতি করতে পারে", "ক্ষতিসাধন"
    ]):
        # Check if it's only about a specific trimester or general avoid
        return "unsafe"
        
    # 2. Definite SAFE in Pregnancy
    # "নিরাপদ", "safe", "সুপারিশকৃত", "first-line", "generally safe"
    if any(k in pw for k in [
        "সাধারণত নিরাপদ", "নিরাপদ", "safe", "সুপারিশকৃত", "first-line",
        "generally considered safe", "standard supplementation", "first-line choice"
    ]):
        # Ensure it doesn't have "নিরাপদ নয়" or "not safe"
        if not any(neg in pw for neg in ["নিরাপদ নয়", "not safe", "unsafe"]):
            return "safe"

    # 3. Caution / Doctor Monitoring
    return "caution"

results = {"safe": [], "caution": [], "unsafe": []}

for d in drugs:
    pw = d.get("pregnancy_warning", "")
    rating = get_clinical_rating(pw, d.get("contraindications", ""))
    results[rating].append({
        "id": d["id"],
        "name": d["name"],
        "generic": d.get("generic_name", ""),
        "pw": pw
    })

print(f"Safe: {len(results['safe'])}, Caution: {len(results['caution'])}, Unsafe: {len(results['unsafe'])}")

with open("eval/classification_results.json", "w", encoding="utf-8") as out:
    json.dump(results, out, ensure_ascii=False, indent=2)
