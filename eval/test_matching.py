import json
import re

with open("data/drugs_corpus.json", "r", encoding="utf-8") as f:
    corpus = json.load(f)

# Load the generated 302 dataset
import subprocess

STOP_WORDS = {
    "is", "can", "i", "take", "safe", "for", "in", "during", "pregnancy", "pregnant", 
    "lactation", "breastfeeding", "medicine", "drug", "tablet", "syrup", "capsule", 
    "dose", "dosing", "should", "what", "about", "use", "when",
    "কি", "খাওয়া", "যাবে", "সেবন", "করা", "নিরাপদ", "গর্ভাবস্থায়", "গর্ভবতী", "ওষুধ", 
    "ট্যাবলেট", "ক্যাপসুল", "খেলে", "কোনো", "ক্ষতি", "হবে", "পার্শ্বপ্রতিক্রিয়া", "খাব",
    "খেতে", "পারব", "পারি", "নিয়ম", "মাত্রা", "ডোজ"
}

def clean_query_tokens(q):
    tokens = re.findall(r"[\w\u0980-\u09FF]+", q.lower())
    meaningful = [t for t in tokens if t not in STOP_WORDS and len(t) >= 2]
    return meaningful if meaningful else tokens

test_queries = [
    ("নাপা সেবন কি নিরাপদ?", "napa"),
    ("Is Napa Safe?", "napa"),
    ("সেকলো (গ্যাস্ট্রিক)", "seclo"),
    ("ফ্লেক্সি ব্যথানাশক", "flexi"),
    ("এন্টাসিড সিরাপ", "entacyd"),
    ("ইনডেভার প্রেসার", "indever"),
    ("ফলিক এসিড কি খাওয়া যাবে?", "folison"),
    ("ক্যালসিয়াম ট্যাবলেট", "calbo-d"),
    ("Is Cefixime safe?", "cefixime"),
    ("Amoxicillin in pregnancy", "amoxicillin"),
    ("Azithromycin for infection", "azithromycin"),
    ("Metformin for diabetes", "metformin"),
    ("Warfarin risks in pregnancy", "warfarin"),
    ("ডক্সিসাইক্লিন কি ক্ষতি করে?", "doxycycline"),
    ("সিপ্রোফ্লক্সাসিন খাওয়া যাবে কি?", "ciprofloxacin"),
    ("Ondansetron for vomiting", "ondansetron"),
    ("Labetalol for high BP", "labetalol"),
    ("Methyldopa blood pressure", "methyldopa")
]

print("Test queries defined:", len(test_queries))
for q, expected in test_queries:
    tokens = clean_query_tokens(q)
    print(f"Query: '{q}' -> Core medical tokens: {tokens}")
