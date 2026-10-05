import json
import re

with open("data/drugs_corpus.json", "r", encoding="utf-8") as f:
    drugs = json.load(f)

def classify_safety(drug):
    pw = (drug.get("pregnancy_warning") or "").lower()
    contra = (drug.get("contraindications") or "").lower()
    cat = (drug.get("category") or "").lower()
    
    # Check for strictly unsafe / contraindicated
    unsafe_keywords = [
        "contraindicated", "নিষিদ্ধ", "ঝুঁকিপূর্ণ", "ক্ষতিকর", "বর্জনীয়", 
        "category d", "category x", "টেরাটোজেনিক", "teratogenic", "ভ্রূণের ক্ষতি",
        "অঙ্গহানি", "কখনই নয়", "মারাত্মক", "strictly avoid", "do not use", "not recommended",
        "unsafe"
    ]
    caution_keywords = [
        "caution", "সতর্কতা", "নজরদারি", "মনিটরিং", "সীমিত", "ডাক্তারের পরামর্শ",
        "উপকারিতা ঝুঁকির চেয়ে বেশি", "second line", "বিকল্প না থাকলে", "বিশেষজ্ঞের"
    ]
    safe_keywords = [
        "safe", "নিরাপদ", "সুপারিশকৃত", "first line", "recommended", "স্বাভাবিক",
        "category b", "category a"
    ]
    
    # Check unsafe first
    for kw in ["contraindicated", "নিষিদ্ধ", "বর্জনীয়", "teratogenic", "টেরাটোজেনিক", "মারাত্মক", "category x", "category d"]:
        if kw in pw or kw in contra:
            return "unsafe"
            
    for kw in safe_keywords:
        if kw in pw and not any(u in pw for u in ["not safe", "unsafe", "নিরাপদ নয়"]):
            # make sure it doesn't say unsafe or caution in pw
            if "caution" not in pw and "সতর্কতা" not in pw and "সীমাবদ্ধ" not in pw:
                return "safe"
                
    for kw in unsafe_keywords:
        if kw in pw or kw in contra:
            return "unsafe"
            
    for kw in caution_keywords:
        if kw in pw or kw in contra:
            return "caution"
            
    return "caution"

safe_count = 0
caution_count = 0
unsafe_count = 0

sample_classified = []

for d in drugs:
    rating = classify_safety(d)
    if rating == "safe":
        safe_count += 1
    elif rating == "caution":
        caution_count += 1
    else:
        unsafe_count += 1
    sample_classified.append({
        "id": d["id"],
        "name": d["name"],
        "generic": d.get("generic_name", ""),
        "brand": d.get("brand_names", ""),
        "rating": rating,
        "pregnancy_warning": d.get("pregnancy_warning", ""),
        "lactation_warning": d.get("lactation_warning", "")
    })

stats = {
    "total": len(drugs),
    "safe": safe_count,
    "caution": caution_count,
    "unsafe": unsafe_count,
    "samples": sample_classified[:15]
}

with open("eval/corpus_stats.json", "w", encoding="utf-8") as out:
    json.dump(stats, out, ensure_ascii=False, indent=2)

print(f"Total: {len(drugs)}, Safe: {safe_count}, Caution: {caution_count}, Unsafe: {unsafe_count}")
