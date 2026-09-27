import os
import sys
import json
from pathlib import Path
import joblib
import numpy as np
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from py_src import rag_pipeline
from py_src.feature_engineering import (
    compute_lexical_overlap,
    check_relevant_drug_retrieved,
    count_hedging_words,
    KNOWN_DRUGS
)

load_dotenv(BASE_DIR / ".env")

template_dir = BASE_DIR / "app" / "templates"
app = Flask(__name__, template_folder=str(template_dir))

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Preload embedding model and index at startup
print("Initializing RAG index & models for web app...")
rag_pipeline.build_or_load_index()

# Load trained ML model if available
MODELS_DIR = BASE_DIR / "models"
MODEL_FILE = str(MODELS_DIR / "rf_classifier.joblib")
FEATURE_NAMES_FILE = str(MODELS_DIR / "feature_names.json")
clf_model = None
feature_names = None

if os.path.exists(MODEL_FILE) and os.path.exists(FEATURE_NAMES_FILE):
    try:
        clf_model = joblib.load(MODEL_FILE)
        with open(FEATURE_NAMES_FILE, "r", encoding="utf-8") as f:
            feature_names = json.load(f)
        print("Successfully loaded trained Random Forest classifier!")
    except Exception as e:
        print(f"Could not load ML model: {e}")


def infer_query_type(question: str) -> str:
    """Heuristic query type detector for live inference."""
    q_lower = question.lower()
    matched = False
    for drug in KNOWN_DRUGS:
        for term in drug["terms"]:
            if term.lower() in q_lower:
                matched = True
                break
        if matched:
            break

    if matched:
        return "in-corpus"

    # If no in-corpus drug is matched, check if it's a generic/vague symptom query
    generic_symptom_phrases = [
        "কোন ওষুধ", "কি ওষুধ", "কোনটি খাব", "কি খাব", "কোন অ্যান্টিবায়োটিক",
        "সব ওষুধ", "ভেষজ", "ঘরোয়া", "লাল ক্যাপসুল", "কোন ব্যথানাশক", "কোন কাশির সিরাপ"
    ]
    if any(phrase in q_lower for phrase in generic_symptom_phrases):
        return "ambiguous"

    # Otherwise, an un-indexed drug or external substance was asked
    return "out-of-corpus"


def predict_label(features: dict) -> str:
    """Predict label using trained ML classifier or explainable rule baseline."""
    global clf_model, feature_names
    if clf_model is not None and feature_names is not None:
        # Build vector matching feature_names
        vec = []
        for fn in feature_names:
            if fn.startswith("query_type_"):
                q_type = fn.replace("query_type_", "")
                vec.append(1 if features.get("query_type") == q_type else 0)
            else:
                vec.append(features.get(fn, 0.0))
        pred = clf_model.predict([vec])[0]
        return str(pred).capitalize()

    # Rule-based fallback before manual labeling / ML training
    cos_sim = features["cosine_similarity"]
    rel_drug = features["relevant_drug_retrieved"]
    q_type = features["query_type"]

    if q_type == "out-of-corpus" and rel_drug == 0 and cos_sim < 0.35:
        return "Hallucinated"
    elif cos_sim > 0.50 and rel_drug == 1:
        return "Faithful"
    else:
        return "Partial"


def compute_confidence_and_explanation(label: str, features: dict, retrieved_chunks: list) -> tuple:
    """Generate 0-100% confidence score and human-readable Bengali explanation."""
    cos_sim = features.get("cosine_similarity", 0.0)
    lex_overlap = features.get("lexical_overlap_ratio", 0.0)
    rel_drug = features.get("relevant_drug_retrieved", 0)
    q_type = features.get("query_type", "in-corpus")

    drug_name = retrieved_chunks[0].get("name", "") if (retrieved_chunks and rel_drug == 1) else ""

    if label.lower().startswith("faith"):
        score = int(np.clip(75 + (cos_sim * 15) + (lex_overlap * 10), 80, 99))
        name_str = f"সঠিক ওষুধ ({drug_name})" if drug_name else "প্রাসঙ্গিক ওষুধ"
        explanation = f"{name_str} ডাটাবেজে পাওয়া গেছে এবং উত্তরটি মূল তথ্যের সাথে {int(cos_sim * 100)}% শব্দার্থিক ও {int(lex_overlap * 100)}% আক্ষরিকভাবে সম্পূর্ণ মিলেছে, তাই এটি নির্ভরযোগ্য ও নিরাপদ।"
    elif label.lower().startswith("hallucin"):
        score = int(np.clip((cos_sim * 35) + (lex_overlap * 20), 5, 38))
        if q_type == "out-of-corpus" and rel_drug == 0:
            explanation = "⚠️ এই ওষুধটি আমাদের ৩০২টি ওষুধের ডাটাবেজে অন্তর্ভুক্ত নেই। ফলে AI উত্তরের সত্যতা যাচাই করা যায়নি (কনটেক্সট মিল মাত্র " + f"{int(cos_sim * 100)}%), যা ক্লিনিক্যালি ঝুঁকিপূর্ণ হ্যালুসিনেশন হতে পারে।"
        else:
            explanation = f"উত্তরের দাবির সাথে ডাটাবেজের মূল তথ্যের নির্ভরযোগ্য মিল নেই (সিমিলারিটি মাত্র {int(cos_sim * 100)}%), তাই এটি অনির্ভরযোগ্য ও হ্যালুসিনেটেড।"
    else:  # Partial
        score = int(np.clip(45 + (cos_sim * 25) + (lex_overlap * 15) + (rel_drug * 10), 45, 78))
        explanation = f"উত্তরটির সাথে ডাটাবেজের তথ্যের আংশিক মিল রয়েছে ({int(cos_sim * 100)}%), তবে এতে কিছু সাধারণ বা অতিরিক্ত বক্তব্য রয়েছে যা সম্পূর্ণ তথ্যভিত্তিক নয়।"

    return score, explanation


SYSTEM_STATS = {
    "total_drugs": 302,
    "eval_questions": 60,
    "accuracy_pct": 98.3,
    "rf_accuracy_pct": 95.0,
    "hallucination_recall_pct": 100,
    "out_of_corpus_count": 15
}


@app.route("/")
def index():
    return render_template("index.html", stats=SYSTEM_STATS)


@app.route("/api/query", methods=["POST"])
def api_query():
    data = request.get_json() or {}
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "প্রশ্ন প্রদান করা হয়নি।"}), 400

    try:
        # 1. Run RAG Pipeline (Grounded in corpus)
        rag_result = rag_pipeline.run_rag_pipeline(question, top_k=3)
        answer = rag_result["generated_answer"]
        retrieved_chunks = rag_result["retrieved_chunks"]

        # 2. Run Direct LLM Path (No RAG, no retrieved context, no grounding prompt)
        direct_answer = rag_pipeline.generate_direct_llm_answer(question)

        # 3. Compute Features (for RAG answer only)
        emb_model = rag_pipeline.get_embedding_model()
        combined_context = " ".join([c["text"] for c in retrieved_chunks])

        ans_emb = emb_model.encode([answer], normalize_embeddings=True)[0]
        ctx_emb = emb_model.encode([combined_context], normalize_embeddings=True)[0]
        cos_sim = float(np.dot(ans_emb, ctx_emb))

        lex_overlap = compute_lexical_overlap(answer, combined_context)
        rel_drug = check_relevant_drug_retrieved(question, retrieved_chunks)
        ans_len = len(answer.strip().split())
        hedge_cnt = count_hedging_words(answer)
        q_type = infer_query_type(question)

        features = {
            "cosine_similarity": round(cos_sim, 4),
            "lexical_overlap_ratio": round(lex_overlap, 4),
            "relevant_drug_retrieved": rel_drug,
            "answer_length_words": ans_len,
            "hedging_count": hedge_cnt,
            "query_type": q_type
        }

        # 4. Predict Hallucination Label (for RAG answer only)
        label = predict_label(features)
        conf_score, explanation_bn = compute_confidence_and_explanation(label, features, retrieved_chunks)
        is_ooc_alert = (q_type == "out-of-corpus" and rel_drug == 0)

        return jsonify({
            "question": question,
            "answer": answer,
            "rag_answer": answer,
            "direct_answer": direct_answer,
            "predicted_label": label,
            "confidence_score": conf_score,
            "explanation_bn": explanation_bn,
            "is_out_of_corpus_alert": is_ooc_alert,
            "features": features,
            "retrieved_chunks": retrieved_chunks,
            "stats": SYSTEM_STATS
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
