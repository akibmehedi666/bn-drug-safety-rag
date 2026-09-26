# বাংলা ড্রাগ-সেফটি RAG এবং হ্যালুসিনেশন ডিটেকশন ML সিস্টেম
### (Bangla Drug-Safety RAG System with Classical ML Hallucination Detection for Maternal & Child Health)

**Academic Research & Clinical Safety Verification System**

---

## ১. প্রজেক্ট পরিচিতি ও উদ্দেশ্য (Project Overview)
গর্ভকালীন (Pregnancy) এবং স্তন্যদানকালীন (Lactation/Breastfeeding) সময়ে সাধারণ মানুষ ও স্বাস্থ্যকর্মীদের ওষুধের নিরাপত্তা সম্পর্কিত প্রশ্নের উত্তর দেওয়ার ক্ষেত্রে জেনারেটিভ এআই-এর (LLM) সবচেয়ে গুরুতর ঝুঁকি হলো **মেডিকেল হ্যালুসিনেশন** (মিথ্যা আশ্বাস বা ভুল পরামর্শ প্রদান)। 

উদাহরণস্বরূপ, ভ্রূণের জন্য মারাত্মক ক্ষতিকর ওষুধকেও সরাসরি এলএলএম অনেক সময় *"ডাক্তারের পরামর্শে খাওয়া যেতে পারে"* বলে বিভ্রান্তিকর উত্তর দিতে পারে। এই সিস্টেমে একটি দুই-স্তরের নিরাপত্তা বলয় তৈরি করা হয়েছে:
1. **RAG রিট্রিভাল লেয়ার:** ৩০২টি প্রয়োজনীয় ওষুধের ভেরিফাইড বাংলা মেডিকেল জ্ঞানভাণ্ডার (MCH Corpus) থেকে হাইব্রিড ভেক্টর সার্চে সঠিক তথ্য খুঁজে বের করে উত্তর গ্রাউন্ড করা।
2. **ক্লাসিক্যাল ML হ্যালুসিনেশন ডিটেকশন লেয়ার:** ৬টি ব্যাখ্যাযোগ্য ফিচার এক্সট্র্যাক্ট করে লজিস্টিক রিগ্রেশন ও র্যান্ডম ফরেস্ট ক্লাসিফায়ারের মাধ্যমে উত্তরটি **বিশ্বস্ত (Faithful)**, **আংশিক (Partial)** নাকি **হ্যালুসিনেটেড (Hallucinated)** তা তাৎক্ষণিক সনাক্ত করা।

---

## ২. সিস্টেম আর্কিটেকচার (System Architecture)

```
[ বাংলা প্রশ্ন (Bengali Query) ]
       │
       ▼
[ Multilingual Sentence Transformer (MiniLM-L12-v2) ] ──> Query Embedding (384-dim)
       │
       ▼
[ Hybrid Retrieval: Cosine Similarity + Lexical Boost (+0.75) ]
       │  (Targeted Generic/Brand keyword match; formulation stop-words filtered)
       ▼
[ Top-3 Context Chunks ] ──> data/embeddings.npy (৩০২টি ওষুধের ডাটাবেজ)
       │
       ├─────────────────────────────────────────┐
       ▼                                         ▼
[ Path A: With RAG (নিরাপদ) ]           [ Path B: Without RAG (ঝুঁকিপূর্ণ) ]
• Gemini LLM + Grounded Prompt          • Direct Gemini LLM (No Context)
• শুধুমাত্র প্রাপ্ত তথ্যের ভিত্তিতে উত্তর       • কোনো গ্রাউন্ডিং নেই (Baseline Comparison)
       │
       ▼
[ Feature Engineering Layer (৬টি ব্যাখ্যাযোগ্য ফিচার) ]
       ├── 1. Cosine Similarity (উত্তর ও কনটেক্সটের শব্দার্থিক মিল)
       ├── 2. Lexical Overlap Ratio (সরাসরি বাংলা শব্দের মিল অনুপাত)
       ├── 3. Relevant Drug Retrieved Flag (প্রশ্নকৃত ড্রাগটি ডাটাবেজে ছিল কি না: 1/0)
       ├── 4. Answer Word Count (উত্তরের শব্দ সংখ্যা)
       ├── 5. Hedging Words Count ("পরামর্শ নিন", "ঝুঁকি", "সতর্কতা", ইত্যাদি)
       └── 6. Query Type (In-corpus / Out-of-corpus / Ambiguous)
       │
       ▼
[ Classical ML Classifier (Random Forest / Logistic Regression) ]
       │  • Logistic Regression Accuracy: ৯৮.৩%
       │  • Random Forest Accuracy: ৯৫.০%
       │  • Hallucination Recall: ১০০% (Zero Missed Hallucinations)
       ▼
[ Web Presentation UI ]
       ├── সার্কুলার কনফিডেন্স গেজ (০-১০০%)
       ├── বাংলায় স্বয়ংক্রিয় যুক্তিযুক্ত ব্যাখ্যা (Auto Explanation)
       ├── আউট-অফ-কর্পাস ভিজ্যুয়াল অ্যালার্ট ব্যানার
       └── পাশাপাশি তুলনা ভিউ (Side-by-Side RAG vs Direct LLM)
```

---

## ৩. ফাইল ও ফোল্ডার ডিরেক্টরি (Project Directory Structure)

```
ML Project/
├── run.py                          # ওয়েব অ্যাপ চালুর মূল এন্ট্রি পয়েন্ট
├── requirements.txt                # পাইথন প্যাকেজ ডিপেন্ডেন্সিসমূহ
├── README.md                       # প্রজেক্ট ওভারভিউ ও গাইড
├── .env.example                    # পরিবেশ ভ্যারিয়েবল টেমপ্লেট (GEMINI_API_KEY)
├── .env                            # স্থানীয় কনফিগারেশন ফাইল
│
├── data/                           # কর্পাস ও ভেক্টর এমবেডিংস
│   ├── drugs_corpus.json           # ৩০২টি ওষুধের বাংলা রেকর্ড (JSON)
│   ├── drugs_corpus.csv            # ৩০২টি ওষুধের বাংলা রেকর্ড (CSV)
│   ├── embeddings.npy              # ৩০২x৩৮৪ ভেক্টরাইজড এমবেডিংস
│   ├── MCH_Drug_Corpus_v2_300plus.xlsx # মূল ক্লিনিক্যাল এক্সেল ফাইল
│   ├── drugs_corpus_prototype20.json # প্রোটোটাইপ ২০টি ওষুধের ব্যাকআপ
│   └── drugs_corpus_prototype20.csv
│
├── src/                            # মূল কোড পাইপলাইন
│   ├── rag_pipeline.py             # রিট্রিভাল, হাইব্রিড স্কোরিং ও জেমিনি জেনারেশন
│   ├── feature_engineering.py      # ৬টি ফিচার নিষ্কাশন লজিক
│   └── ingest_mch_corpus.py        # এক্সেল থেকে কর্পাস প্রসেসর
│
├── eval/                           # মূল্যায়ন বেঞ্চমার্ক ও লগ
│   ├── eval_questions.json         # ৬০টি শ্রেণীবদ্ধ টেস্ট প্রশ্ন
│   ├── generate_eval_dataset.py    # টেস্ট প্রশ্ন ডেটাসেট তৈরি স্ক্রিপ্ট
│   ├── run_evaluation.py           # ৬০টি প্রশ্নে RAG ইভ্যালুয়েশন রানার
│   ├── rag_eval_logs.json          # পূর্ণাঙ্গ ইভ্যালুয়েশন লগ
│   ├── rag_features_labeled.csv    # ট্রেইনিং ডেটাসেট (৬০টি স্যাম্পল)
│   ├── rag_features_unlabeled.csv  # আনলেবেলড ফিচার ম্যাট্রিক্স
│   └── test_comparison_results.json
│
├── models/                         # ট্রেইনকৃত মেশিন লার্নিং মডেল
│   ├── train_models.py             # ৫-ফোল্ড ক্রস-ভ্যালিডেশন ট্রেইনার
│   ├── rf_classifier.joblib        # র্যান্ডম ফরেস্ট মডেল ফাইল
│   ├── lr_classifier.joblib        # লজিস্টিক রিগ্রেশন মডেল ফাইল
│   ├── scaler.joblib               # স্ট্যান্ডার্ড স্কেলার
│   └── feature_names.json          # ফিচার তালিকার স্কিমা
│
└── app/                            # ওয়েব অ্যাপ্লিকেশন
    ├── app.py                      # ফ্লাস্ক ব্যাকএন্ড সার্ভার ও এপিআই
    └── templates/
        └── index.html              # প্রেজেন্টেশন-রেডি ইন্টারেক্টিভ ইউআই
```

---

## ৪. কীভাবে প্রজেক্টটি চালাবেন (How to Run)

### ধাপ ১: ডিপেন্ডেন্সি ইনস্টল করা
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### ধাপ ২: Gemini API Key কনফিগার করা
`.env` ফাইলে আপনার Google Gemini API Key দিন (ঐচ্ছিক — কী না দিলেও অফলাইন ডেমোনস্ট্রেশন মোডে সিস্টেম চলবে):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### ধাপ ৩: ওয়েব অ্যাপ্লিকেশন চালু করা
```bash
python run.py
# অথবা: python app/app.py
```
ব্রাউজারে খুলুন: **http://127.0.0.1:5000**

### ধাপ ৪: মেশিন লার্নিং মডেল পুনরায় ট্রেইন করা (ঐচ্ছিক)
```bash
python models/train_models.py
```

### ধাপ ৫: মূল্যায়ন বেঞ্চমার্ক পুনরায় রান করা (ঐচ্ছিক)
```bash
python eval/run_evaluation.py
```

---

## ৫. মেশিন লার্নিং মডেল পারফরম্যান্স (Model Results)

৬০টি ক্লিনিক্যাল টেস্ট প্রশ্নে ৫-ফোল্ড স্ট্র্যাটিফাইড ক্রস-ভ্যালিডেশনের ফলাফল:

| মডেল (Model) | অ্যাকুরেসি (Accuracy) | ম্যাক্রো F1 (Macro F1) | হ্যালুসিনেশন রিকল (Recall) |
|---|:---:|:---:|:---:|
| **Logistic Regression** | **৯৮.৩৩%** | **০.৯৮৭৫** | **১০০% (১.০০)** |
| **Random Forest Classifier** | **৯৫.০০%** | **০.৯৬২৮** | **১০০% (১.০০)** |

### র্যান্ডম ফরেস্ট ফিচার গুরুত্ব (Feature Importances):
1. `query_type_out-of-corpus`: **১৮.৮৫%**
2. `relevant_drug_retrieved`: **১৬.০০%**
3. `cosine_similarity`: **১৫.৬২%**
4. `query_type_in-corpus`: **১৫.৫৬%**
5. `lexical_overlap_ratio`: **১৩.৩৭%**
6. `answer_length_words`: **১০.২৪%**
7. `query_type_ambiguous`: **৯.২৬%**
8. `hedging_count`: **১.১০%**

---

## ৬. প্রেজেন্টেশন ও ডিফেন্সের জন্য বিশেষ দিকসমূহ
1. **কেন ৩০২টি ড্রাগে সম্প্রসারণ?** — গর্ভকালীন উচ্চ রক্তচাপের ল্যাবেটালল, ডায়াবেটিসের মেটফরমিন কিংবা এক্ল্যাম্পসিয়ার ম্যাগনেসিয়াম সালফেটের মতো জীবনরক্ষাকারী ওষুধের সঠিক তথ্য নিশ্চিত করার জন্য।
2. **কেন হাইব্রিড রিট্রিভাল?** — ডেন্স এমবেডিং মাঝে মাঝে সাধারণ ভিটামিনের দিকে ড্রিফট করতে পারে; তাই ড্রাগের বাংলা ও জেনেরিক নামের লেক্সিক্যাল বুস্ট (+০.৭৫) যোগ করে টার্গেট ড্রাগ ১০০% নির্ভুলভাবে প্রথম স্থানে আনা হয়েছে।
3. **কেন পাশাপাশি তুলনা (Side-by-Side)?** — সরাসরি জেনারেটিভ এআই থ্যালিডোমাইড বা মেথোট্রেক্সেটের মতো বিপজ্জনক ওষুধের ক্ষেত্রে কী ধরনের বিভ্রান্তিকর মিথ্যা আশ্বাস দেয়, আর RAG কীভাবে তা আটকে দেয় — তা স্পষ্টভাবে প্রমাণের জন্য।
