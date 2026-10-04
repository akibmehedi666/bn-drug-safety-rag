import json
import re

with open("data/drugs_corpus.json", "r", encoding="utf-8") as f:
    drugs = json.load(f)

def classify_drug(d):
    pw = (d.get("pregnancy_warning") or "").lower()
    contra = (d.get("contraindications") or "").lower()
    gen = (d.get("generic_name") or "").lower()
    cat = (d.get("category") or "").lower()
    name = (d.get("name") or "").lower()
    
    # 1. Definite Known Contraindicated/Unsafe drugs
    unsafe_generics = [
        "warfarin", "enalapril", "losartan", "ramipril", "captopril", "valsartan", "telmisartan",
        "atorvastatin", "rosuvastatin", "simvastatin", "methotrexate", "isotretinoin", "tretinoin",
        "doxycycline", "tetracycline", "ciprofloxacin", "levofloxacin", "moxifloxacin", "ofloxacin",
        "aceclofenac", "diclofenac", "ibuprofen", "naproxen", "mefenamic acid", "ketorolac",
        "indomethacin", "celecoxib", "ribavirin", "griseofulvin", "valproate", "valproic acid",
        "carbamazepine", "phenytoin", "lithium", "finasteride", "dutasteride", "danazol",
        "misoprostol", "leflunomide", "thalidomide"
    ]
    for ug in unsafe_generics:
        if ug in gen or ug in name:
            return "unsafe"
            
    # Definite Unsafe text matches
    if any(k in pw for k in [
        "contraindicated", "সম্পূর্ণ নিষিদ্ধ", "ব্যবহার নিষিদ্ধ", "কখনই নয়",
        "teratogenic", "টেরাটোজেনিক", "category x", "ক্যাটাগরি এক্স", "category d", "ক্যাটাগরি ডি",
        "do not use", "strictly avoid", "avoid throughout pregnancy", "fetal renal toxicity",
        "premature ductus closure", "ভ্রূণের অঙ্গহানি", "ভ্রূণহানি"
    ]):
        return "unsafe"

    # Avoid / Unsafe matches in pw
    if any(k in pw for k in [
        "এড়িয়ে চলুন", "এড়ানো হয়", "avoid in 3rd trimester", "avoid, especially 3rd trimester",
        "avoid in pregnancy", "avoided (", "avoided due to", "avoided near term", "not recommended",
        "উচ্চ ঝুঁকি", "মারাত্মক ঝুঁকি"
    ]):
        # Check if it's near term only or general avoid
        if "avoid in 3rd trimester" in pw or "avoided, especially 3rd trimester" in pw or "avoided" in pw or "avoid in pregnancy" in pw:
            return "unsafe"
            
    # 2. Definite Safe drugs
    safe_generics = [
        "paracetamol", "acetaminophen", "ferrous", "folic acid", "calcium carbonate", "cholecalciferol",
        "pyridoxine", "amoxicillin", "ampicillin", "cephalexin", "cefixime", "cefuroxime", "ceftriaxone",
        "azithromycin", "erythromycin", "insulin", "metformin", "labetalol", "methyldopa", "nifedipine",
        "omeprazole", "esomeprazole", "aluminum hydroxide", "magnesium hydroxide", "simethicone",
        "sucralfate", "cetirizine", "loratadine", "chlorpheniramine", "salbutamol", "budesonide",
        "lactulose", "ispaghula", "doxylamine"
    ]
    for sg in safe_generics:
        if sg in gen or sg in name:
            if "unsafe" not in pw and "contraindicated" not in pw:
                return "safe"
                
    if any(k in pw for k in [
        "নিরাপদ", "safe", "সুপারিশকৃত", "first-line", "generally safe", "standard supplementation",
        "first-line choice", "reassuring data", "ভালো তথ্য", "নিরাপদ বলে বিবেচিত"
    ]):
        if not any(neg in pw for neg in ["নিরাপদ নয়", "not safe", "unsafe", "সতর্কতা", "caution", "সীমিত", "এড়িয়ে"]):
            return "safe"
            
    return "caution"

counts = {"safe": 0, "caution": 0, "unsafe": 0}
classification = []
for d in drugs:
    r = classify_drug(d)
    counts[r] += 1
    classification.append({
        "id": d["id"],
        "name": d["name"],
        "generic": d.get("generic_name", ""),
        "rating": r,
        "pw": d.get("pregnancy_warning", "")
    })

print(f"Classification result: Safe: {counts['safe']}, Caution: {counts['caution']}, Unsafe: {counts['unsafe']}")

with open("eval/final_ratings.json", "w", encoding="utf-8") as out:
    json.dump({"counts": counts, "drugs": classification}, out, ensure_ascii=False, indent=2)
