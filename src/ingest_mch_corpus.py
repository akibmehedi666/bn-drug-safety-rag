import os
import shutil
import json
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

EXCEL_FILE = str(DATA_DIR / "MCH_Drug_Corpus_v2_300plus.xlsx")
OLD_JSON = str(DATA_DIR / "drugs_corpus.json")
OLD_CSV = str(DATA_DIR / "drugs_corpus.csv")
BACKUP_JSON = str(DATA_DIR / "drugs_corpus_prototype20.json")
BACKUP_CSV = str(DATA_DIR / "drugs_corpus_prototype20.csv")
OUT_JSON = str(DATA_DIR / "drugs_corpus.json")
OUT_CSV = str(DATA_DIR / "drugs_corpus.csv")
EMBEDDINGS_FILE = str(DATA_DIR / "embeddings.npy")

def main():
    print(f"Loading {EXCEL_FILE}...")
    df = pd.read_excel(EXCEL_FILE, sheet_name="Drugs")
    print(f"Total rows in Excel 'Drugs' sheet: {len(df)}")

    # Backup prototype files if not already backed up
    if os.path.exists(OLD_JSON) and not os.path.exists(BACKUP_JSON):
        shutil.copyfile(OLD_JSON, BACKUP_JSON)
        print(f"Backed up prototype JSON to {BACKUP_JSON}")
    if os.path.exists(OLD_CSV) and not os.path.exists(BACKUP_CSV):
        shutil.copyfile(OLD_CSV, BACKUP_CSV)
        print(f"Backed up prototype CSV to {BACKUP_CSV}")

    # Load old prototype drugs to preserve any rich manual contraindications/dosages
    old_drugs = []
    if os.path.exists(OLD_JSON):
        with open(OLD_JSON, "r", encoding="utf-8") as f:
            old_drugs = json.load(f)

    # Build lookup by generic name keywords from old drugs
    prototype_map = {}
    for d in old_drugs:
        name_clean = d["name"].lower()
        prototype_map[name_clean] = d

    converted_drugs = []
    for idx, row in df.iterrows():
        gen_name = str(row["Generic Name"]).strip() if pd.notna(row["Generic Name"]) else ""
        bn_name = str(row["Bangla Name"]).strip() if pd.notna(row["Bangla Name"]) else ""
        cat = str(row.get("Category", "")).strip() if pd.notna(row.get("Category", "")) else ""
        dtype = str(row.get("Drug Type", "")).strip() if pd.notna(row.get("Drug Type", "")) else ""
        otc = str(row.get("OTC/Prescription", "")).strip() if pd.notna(row.get("OTC/Prescription", "")) else ""
        brand_en = str(row.get("Brand (EN)", "")).strip() if pd.notna(row.get("Brand (EN)", "")) else ""
        brand_bn = str(row.get("Brand (BN)", "")).strip() if pd.notna(row.get("Brand (BN)", "")) else ""
        ind_bn = str(row.get("Indication / General Use (BN)", "")).strip() if pd.notna(row.get("Indication / General Use (BN)", "")) else ""
        ind_en = str(row.get("Indication / General Use (EN)", "")).strip() if pd.notna(row.get("Indication / General Use (EN)", "")) else ""
        preg_bn = str(row.get("Pregnancy Safety (Bangla)", "")).strip() if pd.notna(row.get("Pregnancy Safety (Bangla)", "")) else ""
        preg_en = str(row.get("Pregnancy Safety (draft)", "")).strip() if pd.notna(row.get("Pregnancy Safety (draft)", "")) else ""
        lact_bn = str(row.get("Breastfeeding Safety (Bangla)", "")).strip() if pd.notna(row.get("Breastfeeding Safety (Bangla)", "")) else ""
        lact_en = str(row.get("Breastfeeding Safety (draft)", "")).strip() if pd.notna(row.get("Breastfeeding Safety (draft)", "")) else ""

        # Compose unified display name
        if bn_name and gen_name and gen_name.lower() not in bn_name.lower():
            display_name = f"{bn_name} ({gen_name})"
        else:
            display_name = bn_name or gen_name

        # Check if matched in prototype for richer dosage/contraindications
        proto_match = None
        for proto_key, p_drug in prototype_map.items():
            if gen_name and gen_name.lower() in proto_key:
                proto_match = p_drug
                break
            if bn_name and bn_name in p_drug.get("name", ""):
                proto_match = p_drug
                break

        # Compose dosage / usage instructions
        if proto_match and proto_match.get("dosage"):
            dosage = proto_match["dosage"]
        else:
            dosage = f"ব্যবহার/নির্দেশনা: {ind_bn} ({ind_en})। ক্যাটেগরি: {cat} ({dtype})। সেবন যোগ্যতা: {otc}।"

        # Compose contraindications
        if proto_match and proto_match.get("contraindications"):
            contra = proto_match["contraindications"]
        else:
            contra = f"অতিসংবেদনশীলতা (Allergy) থাকলে বা চিকিৎসকের সুস্পষ্ট পরামর্শ ব্যতীত অননুমোদিত মাত্রায় ব্যবহার পরিহার করুন।"

        # Compose pregnancy safety warning
        if preg_bn:
            preg_warn = f"{preg_bn} ({preg_en})" if preg_en and preg_en != preg_bn else preg_bn
        elif proto_match and proto_match.get("pregnancy_warning"):
            preg_warn = proto_match["pregnancy_warning"]
        else:
            preg_warn = "গর্ভাবস্থায় ব্যবহারের পূর্বে বিশেষজ্ঞ চিকিৎসকের পরামর্শ আবশ্যক।"

        # Compose lactation safety warning
        if lact_bn:
            lact_warn = f"{lact_bn} ({lact_en})" if lact_en and lact_en != lact_bn else lact_bn
        elif proto_match and proto_match.get("lactation_warning"):
            lact_warn = proto_match["lactation_warning"]
        else:
            lact_warn = "স্তন্যদানকালে ব্যবহারের ক্ষেত্রে চিকিৎসকের পরামর্শ ও সতর্কতা মেনে চলা উচিত।"

        # Compose side effects
        if proto_match and proto_match.get("side_effects"):
            side_eff = proto_match["side_effects"]
        else:
            side_eff = "চিকিৎসকের পরামর্শ অনুযায়ী পরিমিত মাত্রায় সেব্য। কোনো জটিলতা বা অ্যালার্জি দেখা দিলে অবিলম্বে ওষুধ বন্ধ করে চিকিৎসকের শরণাপন্ন হতে হবে।"

        # Brand names
        brands = []
        if brand_bn:
            brands.append(brand_bn)
        if brand_en and brand_en not in brand_bn:
            brands.append(brand_en)
        brand_str = " / ".join(brands) if brands else ""

        drug_record = {
            "id": idx + 1,
            "name": display_name,
            "generic_name": gen_name,
            "bangla_name": bn_name,
            "brand_names": brand_str,
            "category": cat,
            "drug_type": dtype,
            "dosage": dosage,
            "contraindications": contra,
            "pregnancy_warning": preg_warn,
            "lactation_warning": lact_warn,
            "side_effects": side_eff
        }
        converted_drugs.append(drug_record)

    # Save to JSON
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(converted_drugs, f, ensure_ascii=False, indent=2)
    print(f"Successfully saved {len(converted_drugs)} drugs to {OUT_JSON}")

    # Save to CSV
    df_out = pd.DataFrame(converted_drugs)
    df_out.to_csv(OUT_CSV, index=False, encoding="utf-8")
    print(f"Successfully saved {len(converted_drugs)} drugs to {OUT_CSV}")

    # Remove stale cached embeddings so rag_pipeline recalculates for all 302+ drugs
    if os.path.exists(EMBEDDINGS_FILE):
        os.remove(EMBEDDINGS_FILE)
        print(f"Removed stale {EMBEDDINGS_FILE} to trigger re-indexing.")

if __name__ == "__main__":
    main()
