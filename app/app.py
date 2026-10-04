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
    is_word_in_text,
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
            if is_word_in_text(term, q_lower):
                matched = True
                break
        if matched:
            break

    if matched:
        return "in-corpus"

    generic_symptom_phrases = [
        "কোন ওষুধ", "কি ওষুধ", "কোনটি খাব", "কি খাব", "কোন অ্যান্টিবায়োটিক",
        "সব ওষুধ", "ভেষজ", "ঘরোয়া", "লাল ক্যাপসুল", "কোন ব্যথানাশক", "কোন কাশির সিরাপ"
    ]
    if any(phrase in q_lower for phrase in generic_symptom_phrases):
        return "ambiguous"

    return "out-of-corpus"


def predict_label(features: dict) -> str:
    """Predict label using trained ML classifier or explainable rule baseline."""
    global clf_model, feature_names
    if clf_model is not None and feature_names is not None:
        vec = []
        for fn in feature_names:
            if fn.startswith("query_type_"):
                q_type = fn.replace("query_type_", "")
                vec.append(1 if features.get("query_type") == q_type else 0)
            else:
                vec.append(features.get(fn, 0.0))
        pred = clf_model.predict([vec])[0]
        return str(pred).capitalize()

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
    else:
        score = int(np.clip(45 + (cos_sim * 25) + (lex_overlap * 15) + (rel_drug * 10), 45, 78))
        explanation = f"উত্তরটির সাথে ডাটাবেজের তথ্যের আংশিক মিল রয়েছে ({int(cos_sim * 100)}%), তবে এতে কিছু সাধারণ বা অতিরিক্ত বক্তব্য রয়েছে যা সম্পূর্ণ তথ্যভিত্তিক নয়।"

    return score, explanation


def build_profile_context(profile: dict) -> str:
    """
    Build a Bengali profile context paragraph to prepend to the LLM prompt.
    This tells the model who it is answering for, so it can add personalized warnings.
    Not used in classifier feature computation.
    """
    if not profile:
        return ""

    stage_map = {
        "1st": "১ম ত্রৈমাসিক (সপ্তাহ ১-১২)",
        "2nd": "২য় ত্রৈমাসিক (সপ্তাহ ১৩-২৭)",
        "3rd": "৩য় ত্রৈমাসিক (সপ্তাহ ২৮-৪০)",
        "lactation": "স্তন্যদানকালীন / প্রসব পরবর্তী পর্যায়"
    }
    stage_label = stage_map.get(profile.get("stage", ""), profile.get("stage", ""))
    week = profile.get("week", "")
    allergies = profile.get("allergies", [])
    conditions = profile.get("conditions", [])

    lines = ["[রোগীর ব্যক্তিগত প্রোফাইল তথ্য]"]
    if stage_label:
        lines.append(f"- গর্ভাবস্থার পর্যায়: {stage_label}")
    if week:
        lines.append(f"- বর্তমান সপ্তাহ: {week}")
    if allergies:
        lines.append(f"- পরিচিত অ্যালার্জি: {', '.join(allergies)}")
    if conditions:
        lines.append(f"- বিদ্যমান শারীরিক অবস্থা: {', '.join(conditions)}")

    lines.append("")
    lines.append("উপরের প্রোফাইল তথ্য বিবেচনা করে উত্তরে প্রাসঙ্গিক ব্যক্তিগতকৃত সতর্কতা যোগ করুন।")
    lines.append("যদি কোনো অ্যালার্জি বা শারীরিক অবস্থা এই ওষুধের সাথে সম্পর্কিত হয়, সেটি স্পষ্ট করে উল্লেখ করুন।")

    return "\n".join(lines)


def construct_prompt_with_profile(query: str, retrieved_chunks: list, profile_ctx: str) -> str:
    """Build grounded prompt with optional profile context."""
    context_str = "\n\n---\n\n".join(
        [f"[তথ্য {i+1}]:\n{chunk['chunk_text']}" for i, chunk in enumerate(retrieved_chunks)]
    )

    profile_section = f"\n\n{profile_ctx}\n" if profile_ctx else ""

    prompt = f"""আপনি একজন দায়িত্বশীল এবং সঠিক তথ্য প্রদানকারী চিকিৎসা সহকারী।
নিচে গর্ভবতী এবং স্তন্যদানকারী মায়েদের ওষুধের নিরাপত্তা বিষয়ক একটি সহায়ক তথ্যভাণ্ডার (Context) দেওয়া হলো।

নির্দেশনা:
১. শুধুমাত্র নিচের প্রদত্ত তথ্যভাণ্ডার (Context) ব্যবহার করে সম্পূর্ণ বাংলায় প্রশ্নের উত্তর দিন।
২. প্রদত্ত তথ্যের বাইরে কোনো কাল্পনিক বা অনুমানভিত্তিক তথ্য যোগ করবেন না।
৩. যদি প্রদত্ত তথ্যে কোনো নির্দিষ্ট ওষুধ বা প্রশ্নের স্পষ্ট উল্লেখ না থাকে, তবে সুস্পষ্টভাবে জানান যে: "প্রদত্ত তথ্যে এই বিষয়ে নিশ্চিত কোনো তথ্য পাওয়া যায়নি। অনুগ্রহ করে একজন নিবন্ধিত চিকিৎসকের (MBBS/বিশেষজ্ঞ) পরামর্শ নিন।"
৪. উত্তর সংক্ষিপ্ত, স্পষ্ট এবং চিকিৎসাগতভাবে সতর্ক রাখুন।{profile_section}
তথ্যভাণ্ডার (Context):
{context_str}

প্রশ্ন:
{query}

বাংলায় উত্তর:"""
    return prompt


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


@app.route("/api/drugs", methods=["GET"])
def api_drugs():
    """Return a list of drug names from the 302-drug corpus for pill display."""
    try:
        corpus = rag_pipeline.load_corpus()
        drugs = []
        seen = set()
        for drug in corpus:
            name = drug.get("name", "").strip()
            generic = drug.get("generic_name", "").strip()
            bangla = drug.get("bangla_name", "").strip()
            brands = drug.get("brand_names", "").strip()
            if not name:
                continue
            key = generic.lower() if generic else name.lower()
            if key in seen:
                continue
            seen.add(key)
            # Build a short display label
            brand_list = [b.strip() for b in brands.split("/") if b.strip()] if brands else []
            drugs.append({
                "id": str(drug.get("id", len(drugs) + 1)),
                "nameEn": generic or name,
                "nameBn": bangla or generic or name,
                "displayBrand": brand_list[0] if brand_list else (generic or name),
                "category": drug.get("category", "")
            })
        return jsonify({"drugs": drugs})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/nutrition", methods=["GET"])
def api_nutrition():
    """Serve nutrition database from JSON file."""
    nutrition_file = BASE_DIR / "data" / "nutrition.json"
    try:
        with open(nutrition_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        supp_file = BASE_DIR / "data" / "supplement_food_map.json"
        supp_map = {}
        if supp_file.exists():
            with open(supp_file, "r", encoding="utf-8") as f:
                supp_map = json.load(f)
        return jsonify({"foods": data, "supplementMap": supp_map})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/symptoms", methods=["GET"])
def api_symptoms():
    """Serve symptoms database from JSON file."""
    symptoms_file = BASE_DIR / "data" / "symptoms.json"
    try:
        with open(symptoms_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify({"symptoms": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/query", methods=["POST"])
def api_query():
    data = request.get_json() or {}
    question = data.get("question", "").strip()
    profile = data.get("profile", {})  # NEW: accept profile from frontend

    if not question:
        return jsonify({"error": "প্রশ্ন প্রদান করা হয়নি।"}), 400

    try:
        # 1. Retrieve relevant chunks
        retrieved = rag_pipeline.retrieve(question, top_k=3)

        # 2. Build grounded prompt — with profile personalization if provided
        profile_ctx = build_profile_context(profile)
        prompt = construct_prompt_with_profile(question, retrieved, profile_ctx)

        # 3. Generate grounded answer
        answer = rag_pipeline.generate_answer(prompt)

        retrieved_chunks = [
            {
                "id": c["id"],
                "name": c["name"],
                "similarity_score": c["similarity_score"],
                "text": c.get("chunk_text") or c.get("text", "")
            }
            for c in retrieved
        ]

        # 4. Run Direct LLM Path (No RAG, no grounding prompt)
        direct_answer = rag_pipeline.generate_direct_llm_answer(question)

        # 5. Compute Features (for RAG answer only — NOT modified by profile)
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

        # 6. Predict Hallucination Label
        label = predict_label(features)
        conf_score, explanation_bn = compute_confidence_and_explanation(label, features, retrieved_chunks)
        is_ooc_alert = (q_type == "out-of-corpus" and rel_drug == 0)

        # 7. Build personalized warnings list for the frontend to display
        personalized_warnings = []
        if profile:
            allergies = profile.get("allergies", [])
            conditions = profile.get("conditions", [])
            week = profile.get("week", 0)
            stage = profile.get("stage", "")
            q_lower = question.lower()
            ans_lower = answer.lower()

            allergy_synonyms = {
                "penicillin": ["penicillin", "পেনিসিলিন", "amoxicillin", "অ্যামোক্সিসিলিন", "ampicillin", "অ্যাম্পিসিলিন", "moxaclav", "মোক্সাক্লাভ"],
                "sulfa": ["sulfa", "সালফা", "cotrimoxazole", "কোট্রাইমোক্সাজল", "bactrim"],
                "aspirin": ["aspirin", "এসপিরিন", "nsaid", "ibuprofen", "আইবুপ্রোফেন", "aceclofenac", "এসেক্লোফেনাক", "flexi", "ফ্লেক্সি", "diclofenac", "ডাইক্লোফেনাক"],
                "prawn": ["prawn", "seafood", "chingri", "চিংড়ি"],
                "dust": ["dust", "ধুলো", "ধূলিকণা", "pollen"]
            }

            retrieved_names = " ".join([c["name"].lower() for c in retrieved_chunks])

            for allergy in allergies:
                a_lower = allergy.lower()
                # Find matching synonym list
                matched_aliases = [a_lower]
                for key, synonyms in allergy_synonyms.items():
                    if key in a_lower:
                        matched_aliases.extend(synonyms)

                if any(alias in q_lower or alias in ans_lower or alias in retrieved_names for alias in matched_aliases):
                    personalized_warnings.append({
                        "type": "allergy",
                        "en": f"⚠️ Allergy Alert: Your profile lists '{allergy}' as a known allergy. Verify with your doctor before taking this medicine.",
                        "bn": f"⚠️ অ্যালার্জি সতর্কতা: আপনার প্রোফাইলে '{allergy}' অ্যালার্জি নথিভুক্ত রয়েছে। এই ওষুধ গ্রহণের আগে চিকিৎসককে অবশ্যই জানান।"
                    })

            if "anemia" in " ".join(conditions).lower() or "রক্তশূন্যতা" in " ".join(conditions).lower():
                if any(kw in q_lower for kw in ["iron", "আয়রন", "folic", "ফলিক", "ferrous", "ফেরাস"]):
                    personalized_warnings.append({
                        "type": "condition",
                        "en": "ℹ️ Condition Note (Anemia): You have recorded mild anemia. Ensure consistent iron and folic acid supplementation and eat iron-rich foods with Vitamin C.",
                        "bn": "ℹ️ শারীরিক অবস্থা (রক্তশূন্যতা): আপনার রক্তশূন্যতা নথিভুক্ত রয়েছে। নিয়মিত আয়রন ও ফলিক এসিড গ্রহণ নিশ্চিত করুন এবং ভিটামিন সি যুক্ত খাবার (লেবু, আমলকী) এর সাথে খান।"
                    })

            if "high blood pressure" in " ".join(conditions).lower() or "hypertension" in " ".join(conditions).lower():
                if any(kw in q_lower for kw in ["pressure", "bp", "প্রেসার", "indever", "ইনডেভার", "labetalol"]):
                    personalized_warnings.append({
                        "type": "condition",
                        "en": "⚠️ Condition Note (Hypertension): Your profile shows high blood pressure. Blood pressure medications in pregnancy require strict monitoring — do not self-adjust dose.",
                        "bn": "⚠️ শারীরিক অবস্থা (উচ্চ রক্তচাপ): আপনার প্রোফাইলে উচ্চ রক্তচাপ নথিভুক্ত। গর্ভাবস্থায় প্রেসারের ওষুধ কঠোর তত্ত্বাবধানে খেতে হবে — নিজে ডোজ পরিবর্তন করবেন না।"
                    })

            if "gestational diabetes" in " ".join(conditions).lower():
                personalized_warnings.append({
                    "type": "condition",
                    "en": "ℹ️ Condition Note (Gestational Diabetes): You have gestational diabetes. Monitor blood sugar regularly and consult your doctor before any new medication.",
                    "bn": "ℹ️ শারীরিক অবস্থা (গর্ভকালীন ডায়াবেটিস): আপনার গর্ভকালীন ডায়াবেটিস নথিভুক্ত। নিয়মিত সুগার পরীক্ষা করুন এবং যেকোনো নতুন ওষুধের আগে চিকিৎসকের পরামর্শ নিন।"
                })

            if stage == "3rd" and int(week or 0) >= 28:
                if any(kw in q_lower for kw in ["flexi", "ibuprofen", "naproxen", "aceclofenac", "diclofenac", "nsaid"]):
                    personalized_warnings.append({
                        "type": "trimester",
                        "en": f"🚫 Trimester Alert (Week {week} – 3rd Trimester): NSAIDs like this are strictly contraindicated in the 3rd trimester — they can cause premature closure of fetal ductus arteriosus.",
                        "bn": f"🚫 ত্রৈমাসিক সতর্কতা ({week}তম সপ্তাহ – ৩য় ত্রৈমাসিক): এই ধরনের NSAID ব্যথানাশক ৩য় ত্রৈমাসিকে সম্পূর্ণ নিষিদ্ধ — এটি শিশুর হৃদযন্ত্রের ডাক্টাস আর্টারিওসাস অকালে বন্ধ করে দিতে পারে।"
                    })

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
            "personalized_warnings": personalized_warnings,
            "stats": SYSTEM_STATS
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
