import json
import re

with open("data/drugs_corpus.json", "r", encoding="utf-8") as f:
    corpus = json.load(f)

print(f"Loaded {len(corpus)} drugs from corpus.")

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
        "indomethacin", "celecoxib", "piroxicam", "meloxicam", "ribavirin", "griseofulvin", 
        "valproate", "valproic acid", "carbamazepine", "phenytoin", "lithium", "finasteride", 
        "dutasteride", "danazol", "misoprostol", "leflunomide", "thalidomide", "methimazole"
    ]
    for ug in unsafe_generics:
        if ug in gen or ug in name:
            return "unsafe"
            
    # Definite Unsafe text matches in pregnancy_warning
    if any(k in pw for k in [
        "contraindicated", "সম্পূর্ণ নিষিদ্ধ", "ব্যবহার নিষিদ্ধ", "কখনই নয়",
        "teratogenic", "টেরাটোজেনিক", "category x", "ক্যাটাগরি এক্স", "category d", "ক্যাটাগরি ডি",
        "do not use", "strictly avoid", "avoid throughout pregnancy", "fetal renal toxicity",
        "premature ductus closure", "ভ্রূণের অঙ্গহানি", "ভ্রূণহানি"
    ]):
        return "unsafe"

    # Avoid / Unsafe matches in pw
    if any(k in pw for k in [
        "avoid in 3rd trimester", "avoid, especially 3rd trimester",
        "avoid in pregnancy", "avoided (", "avoided due to", "not recommended",
        "উচ্চ ঝুঁকি", "মারাত্মক ঝুঁকি"
    ]):
        # Distinguish trimester-limited caution vs full avoid
        if "avoid in 3rd trimester" in pw or "avoid, especially 3rd trimester" in pw or "avoid in pregnancy" in pw or "avoided (" in pw:
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

# Test classification count
counts = {"safe": 0, "caution": 0, "unsafe": 0}
for d in corpus:
    counts[classify_drug(d)] += 1
print(f"Classification counts: {counts}")
