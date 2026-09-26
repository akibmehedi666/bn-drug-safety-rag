# বাংলা ড্রাগ-সেফটি RAG এবং হ্যালুসিনেশন ডিটেকশন ML সিস্টেম
### (Bangla Drug-Safety RAG System with Classical ML Hallucination Detection for Pregnancy & Lactation)

**Academic Research & Presentation Guide**

---

## ১. প্রজেক্ট পরিচিতি ও উদ্দেশ্য (Project Overview)
গর্ভকালীন (Pregnancy) এবং স্তন্যদানকালীন (Lactation/Breastfeeding) সময়ে সাধারণ মানুষ ও চিকিৎসকদের ওষুধের নিরাপত্তা সম্পর্কিত প্রশ্নের উত্তর দেওয়ার জন্য জেনারেটিভ এআই (LLM) ব্যবহারের ক্ষেত্রে অন্যতম প্রধান ঝুঁকি হলো **মেডিকেল হ্যালুসিনেশন** (অসমর্থিত বা ভুল তথ্য তৈরি করা)।

এই প্রজেক্টটি একটি টাইম-বক্সড একাডেমিক প্রজেক্ট হিসেবে নির্মিত, যার লক্ষ্য:
1. গর্ভকালীন ও স্তন্যদানকালীন ২০টি সাধারণ ওষুধের উপর ভিত্তি করে একটি পরীক্ষিত বাংলা মেডিকেল জ্ঞানভাণ্ডার (Knowledge Base) তৈরি করা।
2. বহুভাষিক সেন্টেন্স-ট্রান্সফরমার ও কোসাইন সিমিলারিটি ব্যবহার করে একটি হালকা কিন্তু কার্যকরী RAG (Retrieval-Augmented Generation) পাইপলাইন নির্মাণ করা।
3. ৫০টি বৈচিত্র্যময় বাংলা টেস্ট প্রশ্ন (In-corpus, Out-of-corpus, Ambiguous) দিয়ে সিস্টেমটি মূল্যায়ন করা।
4. উত্তরের বিশ্বস্ততা যাচাইয়ের জন্য ৬টি ব্যাখ্যাযোগ্য ফিচার এক্সট্র্যাক্ট করা।
5. ক্লাসিক্যাল মেশিন লার্নিং (Logistic Regression ও Random Forest) ব্যবহার করে ৫-ফোল্ড স্ট্র্যাটিফাইড ক্রস-ভ্যালিডেশনের মাধ্যমে হ্যালুসিনেশন চিহ্নিতকরণ।
6. একটি সহজ ও পরিষ্কার ওয়েব ইন্টারফেসের (Minimal UI) মাধ্যমে এন্ড-টু-এন্ড ডেমো প্রদর্শন।

---

## ২. সিস্টেম আর্কিটেকচার (Architecture Pipeline)

```
[ বাংলা প্রশ্ন ] (Bengali Query)
       │
       ▼
[ Multilingual Sentence Transformer ] ──> Query Embedding
       │
       ▼
[ Cosine Similarity Search ] <── [ Pre-computed Drug Embeddings (embeddings.npy) ]
       │
       ▼
[ Top-k Context Chunks ] (ওষুধের ডোজ, গর্ভকালীন সতর্কতা, পার্শ্বপ্রতিক্রিয়া)
       │
       ▼
[ Grounded Prompt Construction ] (বাংলা নির্দেশনাবলী ও কঠোর কনটেক্সট সীমাবদ্ধতা)
       │
       ▼
[ Anthropic Claude API (claude-sonnet-4-6) ] ──> Generated Bengali Answer
       │
       ▼
[ Feature Engineering Layer ]
       ├── 1. Cosine Similarity (Answer vs Context)
       ├── 2. Lexical Overlap Ratio (Token intersection)
       ├── 3. Relevant Drug Retrieved Flag (Binary 1/0)
       ├── 4. Answer Word Count
       ├── 5. Bengali Hedging Words Count ("পরামর্শ নিন", "হতে পারে", ইত্যাদি)
       └── 6. Query Type Categorical Flag (In-corpus / Out-of-corpus / Ambiguous)
       │
       ▼
[ Classical ML Classifier (Random Forest / Logistic Regression) ]
       │
       ▼
[ Prediction Badge: Faithful / Hallucinated / Partial ] + Web UI
```

---

## ৩. ফাইল ও ফোল্ডার পরিচিতি (Project Structure)

| ফাইল/ফোল্ডার | বিবরণ |
|---|---|
| `drugs_corpus.json` / `drugs_corpus.csv` | ২০টি সাধারণ ওষুধের নাম, ডোজ, নিষেধাজ্ঞা, গর্ভকালীন সতর্কতা, স্তন্যদানকালীন সতর্কতা ও পার্শ্বপ্রতিক্রিয়া (Part 1)। |
| `rag_pipeline.py` | সেন্টেন্স ট্রান্সফরমার এমবেডিং, কোসাইন সিমিলারিটি রিট্রিভাল, প্রম্পট তৈরি, ক্লদ এপিআই কল এবং লগিং স্ক্রিপ্ট (Part 2)। |
| `generate_eval_dataset.py` | ৫০টি বাংলা টেস্ট প্রশ্নের ডেটাসেট (২৫ In-corpus, ১৫ Out-of-corpus, ১০ Ambiguous) (Part 3)। |
| `feature_engineering.py` | লগ থেকে ৬টি সংখ্যাত্মক ও ক্যাটেগরিক্যাল ফিচার নিষ্কাশন এবং ম্যানুয়াল লেবেলিং টেমপ্লেট তৈরির স্ক্রিপ্ট (Part 4)। |
| `train_models.py` | লজিস্টিক রিগ্রেশন ও র্যান্ডম ফরেস্ট ট্রেইনিং, ৫-ফোল্ড ক্রস-ভ্যালিডেশন ও ফিচার গুরুত্ব পরিমাপ (Part 5)। |
| `app.py` ও `templates/index.html` | সিঙ্গেল-পেজ ন্যূনতম ওয়েব ইউআই (Part 6)। |
| `.env` / `.env.example` | Anthropic API Key কনফিগারেশন। |

---

## ৪. কীভাবে প্রজেক্টটি চালাবেন (How to Run)

### ধাপ ১: ভার্চুয়াল এনভায়রনমেন্ট সক্রিয় করা
```bash
source venv/bin/activate
```

### ধাপ ২: Anthropic API Key কনফিগার করা
`.env` ফাইলে আপনার Anthropic API Key যোগ করুন:
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-sonnet-4-6
```

### ধাপ ৩: RAG পাইপলাইন পরীক্ষা করা (Part 2)
```bash
python rag_pipeline.py --query "গর্ভাবস্থায় প্যারাসিটামল খাওয়া কি নিরাপদ?"
```

### ধাপ ৪: ৫০টি টেস্ট প্রশ্নে ইভ্যালুয়েশন রান করা (Part 3)
```bash
python generate_eval_dataset.py
```

### ধাপ ৫: ফিচার এক্সট্র্যাক্ট করা (Part 4)
```bash
python feature_engineering.py --logs rag_eval_logs.json --out rag_features_unlabeled.csv
```

### ধাপ ৬: ক্লাসিফায়ার ট্রেইন করা (Part 5)
```bash
python train_models.py --csv rag_features_labeled.csv
```

### ধাপ ৭: ওয়েব ইউআই চালু করা (Part 6)
```bash
python app.py
```
ব্রাউজারে খুলুন: `http://127.0.0.1:5000`

---

## ৫. প্রেজেন্টেশন ও ডিফেন্সের জন্য মূল ব্যাখ্যা (Presentation Notes)

1. **কেন Cosine Similarity ও FAISS?**
   - ছোট আকারের কর্পাসে (২০টি ড্রাগ) সাধারণ ভেক্টরাইজড ডট প্রোডাক্ট অত্যন্ত দ্রুত ও নির্ভুল।
2. **কেন ۶টি নির্দিষ্ট ফিচার?**
   - *Cosine Similarity* নির্দেশ করে উত্তরটি কনটেক্সটের অর্থগত কাছাকাছি কি না।
   - *Lexical Overlap* পরিমাপ করে সরাসরি তথ্যের উদ্ধৃতি আছে কি না।
   - *Relevant Drug Retrieved Flag* সরাসরি পরিমাপ করে প্রশ্নকৃত ড্রাগ কর্পাসে ছিল কি না।
   - *Hedging Words* নির্দেশ করে মডেল কি অনিশ্চয়তার কারণে সতর্কবার্তা দিচ্ছে কি না।
   - এই ফিচারগুলো ক্লাসিক্যাল মডেলকে সহজে বুঝতে সাহায্য করে যে উত্তরটি বিশ্বস্ত নাকি ভিত্তিহীন।
