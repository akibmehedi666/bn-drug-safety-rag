# Bengali Drug-Safety RAG & Hallucination Detection System
### (বাংলা ড্রাগ-সেফটি RAG এবং হ্যালুসিনেশন ডিটেকশন ML সিস্টেম)

> **A dual-layered retrieval-augmented generation and classical machine learning verification system for maternal and child drug safety in Bengali.**

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-ee4c2c.svg)](https://pytorch.org/)
[![SentenceTransformers](https://img.shields.io/badge/Sentence--Transformers-MiniLM--L12--v2-yellow.svg)](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-ML--Verification-orange.svg)](https://scikit-learn.org/)
[![Gemini](https://img.shields.io/badge/LLM-Google_Gemini-4285F4.svg)](https://ai.google.dev/)

---

## 📌 Problem It Solves

During pregnancy and lactation, healthcare workers and patients require accurate, verified information regarding medication safety. General-purpose Large Language Models (LLMs) present a critical danger in medical contexts: **medical hallucination**. When asked about contraindicated, teratogenic drugs (e.g., thalidomide or methotrexate), ungrounded LLMs frequently generate misleading reassurances such as *"safe to consume with a doctor's advice"*. Furthermore, low-resource languages like Bengali lack domain-specific grounded clinical benchmarks and safety guardrails.

This system resolves this challenge by establishing a two-tiered defense architecture:
1. **Grounded Retrieval Layer (RAG):** Restricts generative answers to a verified Maternal & Child Health (MCH) corpus covering 302 essential drugs using hybrid dense semantic retrieval and lexical boosting.
2. **Classical ML Verification Layer:** Employs an interpretable classifier over 6 statistical and linguistic features to evaluate every generated response in real time, classifying outputs into **Faithful (বিশ্বস্ত)**, **Partial (আংশিক)**, or **Hallucinated (হ্যালুসিনেটেড)** states.

---

## ✨ Features

- **Curated 302-Drug Bengali MCH Corpus:** Comprehensive verified database detailing generic/brand names, indications, FDA pregnancy risk categories, and lactation safety advisories.
- **Hybrid Dense-Lexical Vector Retrieval:** Combines 384-dimensional dense semantic representations from `paraphrase-multilingual-MiniLM-L12-v2` with a targeted generic/brand lexical match boost (`+0.75`), preventing semantic drift and ensuring exact medication grounding.
- **Side-by-Side Dual Pipeline Comparison:**
  - **Path A (With RAG):** Grounded LLM responses strictly derived from retrieved Top-3 medical context chunks.
  - **Path B (Without RAG):** Direct ungrounded LLM baseline illustrating the severity of raw hallucination risks.
- **Explainable ML Hallucination Classifier:** Extracts 6 verifiable features to assess response fidelity:
  1. *Cosine Similarity* (semantic alignment between answer and context)
  2. *Lexical Overlap Ratio* (exact Bengali token matching)
  3. *Relevant Drug Retrieved Flag* (binary indicator: $1/0$)
  4. *Answer Word Count* (length penalty)
  5. *Hedging Words Count* (frequency of caution phrases: *"সতর্কতা"*, *"ঝুঁকি"*, *"পরামর্শ"*)
  6. *Query Type* (Categorical: In-corpus, Out-of-corpus, Ambiguous)
- **Interactive Web Interface:** Lightweight Flask dashboard enabling real-time Bengali medical queries, side-by-side RAG comparison, and instant ML verification feedback, with full offline retrieval fallback support.

---

## 🛠️ Tech Stack

- **Core Language:** Python 3.10+
- **Embeddings & NLP:** `sentence-transformers` (`paraphrase-multilingual-MiniLM-L12-v2`), PyTorch, Hugging Face
- **Generative AI:** Google Gemini API (`google-generativeai`)
- **Machine Learning & Verification:** `scikit-learn` (`LogisticRegression`, `RandomForestClassifier`), NumPy, Pandas
- **Web Interface:** Flask, Jinja2, HTML5/CSS3
- **Evaluation & Benchmarking:** Matplotlib, Seaborn

---

## 📸 Screenshots

> _Visual demonstration of the side-by-side RAG verification interface and classical ML hallucination detection telemetry._

| Grounded RAG vs Direct LLM Comparison | ML Hallucination Verification Telemetry |
| :---: | :---: |
| ![Grounded RAG Interface Placeholder](docs/screenshots/rag_interface_placeholder.png)<br>_Placeholder: Side-by-side comparative query interface_ | ![Hallucination Scorecard Placeholder](docs/screenshots/hallucination_scorecard_placeholder.png)<br>_Placeholder: Feature radar and faithfulness classification_ |

---

## 🚀 How to Run

### 1. Clone & Set Up Environment

```bash
# Clone the repository
git clone https://github.com/akibmehedi666/bn-drug-safety-rag.git
cd bn-drug-safety-rag

# Create and activate a virtual environment
python -m venv venv

# Windows (PowerShell / CMD)
.\venv\Scripts\Activate.ps1
# Linux / macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure API Keys

Copy the example environment file:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Add your Google Gemini API Key in `.env` (optional — offline retrieval and ML verification work without an API key):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Launch Web Application

```bash
python run.py
# Alternatively: python app/app.py
```
Open your browser and navigate to: **`http://127.0.0.1:5000`**

### 4. Optional: Retrain ML Models & Run Evaluations

```bash
# Retrain Classical ML Hallucination Classifiers
python models/train_models.py

# Execute Evaluation Benchmark Suite
python eval/run_evaluation.py
```

---

## 📊 Experimental Results

### Model Performance (5-Fold Stratified Cross-Validation on 60 Clinical Test Queries)

| Model Architecture | Accuracy | Macro F1 | Hallucination Recall |
| :--- | :---: | :---: | :---: |
| **Logistic Regression** | **98.33%** | **0.9875** | **100% (1.00)** |
| **Random Forest Classifier** | **95.00%** | **0.9628** | **100% (1.00)** |

### Random Forest Feature Importance Distribution

```
Feature                              Importance (%)
────────────────────────────────────────────────────
query_type_out-of-corpus             18.85%
relevant_drug_retrieved              16.00%
cosine_similarity                    15.62%
query_type_in-corpus                 15.56%
lexical_overlap_ratio                13.37%
answer_length_words                  10.24%
query_type_ambiguous                  9.26%
hedging_count                         1.10%
```

---

## 📂 Project Structure

```
bn-drug-safety-rag/
├── app/
│   ├── app.py                     # Flask application routes and API endpoints
│   ├── static/                    # Stylesheets and visual assets
│   └── templates/                 # Web interface templates
├── data/
│   ├── mch_drugs_bengali_302.json # Verified 302-drug maternal clinical knowledge base
│   └── embeddings.npy             # Precomputed 384-dim dense embeddings
├── eval/
│   ├── test_queries.json          # 60 annotated clinical evaluation benchmark queries
│   └── run_evaluation.py          # Cross-validation and performance metric evaluator
├── models/
│   ├── train_models.py            # Feature engineering and classifier training pipeline
│   ├── logistic_regression.pkl    # Trained Logistic Regression classifier weights
│   ├── random_forest.pkl          # Trained Random Forest classifier weights
│   └── scaler.pkl                 # Feature normalizer
├── rag/
│   ├── retriever.py               # Hybrid dense semantic + lexical boost vector search
│   └── generator.py               # Grounded prompt synthesis and Gemini client
├── run.py                         # Application entrypoint
├── requirements.txt               # Pinned dependencies
├── .env.example                   # Environment configuration template
└── README.md                      # Documentation
```
