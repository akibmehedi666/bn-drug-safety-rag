import os
import re
import json
import numpy as np
import pandas as pd

# Standard Bengali hedging and cautionary terms/phrases
HEDGING_KEYWORDS = [
    "পরামর্শ নিন", "পরামর্শ", "চিকিৎসক", "ডাক্তার", "বিশেষজ্ঞ", "রেজিস্টার্ড",
    "হতে পারে", "পারে", "সম্ভাবনা", "সম্ভবত", "নিশ্চিত নয়", "স্পষ্ট নয়",
    "তথ্য নেই", "তথ্য পাওয়া যায়নি", "উল্লেখ নেই", "সতর্কতা", "সাবধানতা",
    "ঝুঁকি", "ক্ষতি", "এড়িয়ে চলা", "নিষেধ", "বিকল্প", "উপদেশ"
]

FORMULATION_STOP_WORDS = {
    "ট্যাবলেট", "ক্যাপসুল", "সিরাপ", "ইনজেকশন", "ড্রপ", "মলম", "স্প্রে", "ক্রিম",
    "সাপ্লিমেন্ট", "কম্বো", "শিশু", "পাউডার", "লোশন", "জেল", "সাসপেনশন",
    "tablet", "capsule", "syrup", "injection", "drops", "spray", "cream",
    "ointment", "supplement", "combo", "infant", "pediatric", "gel", "lotion"
}

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_CORPUS_FILE = str(BASE_DIR / "data" / "drugs_corpus.json")

def load_known_drugs_from_corpus(corpus_path: str = None) -> list:
    """Dynamically load known drugs and search keywords from the JSON corpus."""
    if corpus_path is None:
        corpus_path = DEFAULT_CORPUS_FILE
    if not os.path.exists(corpus_path):
        return []
    try:
        with open(corpus_path, "r", encoding="utf-8") as f:
            corpus = json.load(f)
        drugs_list = []
        for d in corpus:
            terms = set()
            gen = d.get("generic_name", "").strip()
            bn = d.get("bangla_name", "").strip()
            full_name = d.get("name", "").strip()
            brands = d.get("brand_names", "").strip()
            if gen and gen.lower() not in FORMULATION_STOP_WORDS:
                terms.add(gen.lower())
            if bn and bn.lower() not in FORMULATION_STOP_WORDS:
                bn_clean = bn.lower()
                terms.add(bn_clean)
                if bn_clean.endswith("সোন"):
                    terms.add(bn_clean[:-3] + "সন")
                elif bn_clean.endswith("সন"):
                    terms.add(bn_clean[:-2] + "সোন")
            if brands:
                for b in brands.split("/"):
                    b_clean = b.strip().lower()
                    if b_clean and b_clean not in FORMULATION_STOP_WORDS:
                        terms.add(b_clean)
            for word in re.findall(r"[\u0980-\u09FFa-zA-Z]{3,}", full_name):
                w_lower = word.lower()
                if w_lower not in FORMULATION_STOP_WORDS:
                    terms.add(w_lower)
                    if w_lower.endswith("সোন"):
                        terms.add(w_lower[:-3] + "সন")
                    elif w_lower.endswith("সন"):
                        terms.add(w_lower[:-2] + "সোন")
            drugs_list.append({"generic": gen or full_name, "terms": list(terms)})
        return drugs_list
    except Exception:
        return []

KNOWN_DRUGS = load_known_drugs_from_corpus()


def is_word_in_text(term: str, text: str) -> bool:
    """Check if term appears as a distinct word/token in text (supports English & Bengali)."""
    if not term or not text:
        return False
    escaped = re.escape(term.lower())
    pattern = rf"(^|[^\w\u0980-\u09FF]){escaped}($|[^\w\u0980-\u09FF])"
    return bool(re.search(pattern, text.lower()))


def tokenize_bengali(text: str) -> list:
    """Split Bengali text into words, removing punctuation."""
    if not text:
        return []
    # Retain Bengali and alphanumeric characters
    cleaned = re.sub(r"[^\w\s\u0980-\u09FF]", " ", text)
    return [w for w in cleaned.strip().split() if len(w) > 1]


def compute_lexical_overlap(answer: str, context: str) -> float:
    """Compute lexical token overlap ratio between generated answer and context."""
    ans_tokens = set(tokenize_bengali(answer))
    ctx_tokens = set(tokenize_bengali(context))
    if not ans_tokens:
        return 0.0
    overlap = ans_tokens.intersection(ctx_tokens)
    return float(len(overlap) / len(ans_tokens))


def check_relevant_drug_retrieved(question: str, retrieved_chunks: list) -> int:
    """
    Binary flag (1/0): Check whether a drug referenced in the question
    matches any of the retrieved chunks' drugs.
    """
    q_lower = question.lower()
    detected_drug_terms = []

    for drug in KNOWN_DRUGS:
        for term in drug["terms"]:
            if is_word_in_text(term, q_lower):
                detected_drug_terms.append(drug["generic"].lower())
                break

    if not detected_drug_terms:
        # If no known in-corpus drug was referenced in query (e.g. out-of-corpus question)
        return 0

    # Check if any retrieved chunk matches the detected drugs
    for chunk in retrieved_chunks:
        chunk_name = chunk.get("name", "").lower()
        chunk_text = chunk.get("text", "").lower()
        for d in detected_drug_terms:
            if d in chunk_name or d in chunk_text:
                return 1

    return 0


def count_hedging_words(text: str) -> int:
    """Count occurrences of Bengali hedging and cautionary keywords."""
    if not text:
        return 0
    t_lower = text.lower()
    total_count = 0
    for kw in HEDGING_KEYWORDS:
        total_count += t_lower.count(kw.lower())
    return total_count


def extract_features(eval_logs: list, embedding_model=None) -> pd.DataFrame:
    """
    Extract 6 engineered features + placeholder label (null) for each logged interaction:
    1. cosine_similarity (answer vs retrieved context)
    2. lexical_overlap_ratio (answer vs retrieved context)
    3. relevant_drug_retrieved (binary flag 1/0)
    4. answer_length_words (integer)
    5. hedging_count (integer)
    6. query_type (categorical: in-corpus / out-of-corpus / ambiguous)
    """
    records = []

    # If embedding model is provided, compute cosine similarities in batch
    if embedding_model is not None:
        answers = [item.get("generated_answer", "") for item in eval_logs]
        contexts = [
            " ".join([c.get("text", "") for c in item.get("retrieved_chunks", [])])
            for item in eval_logs
        ]
        ans_embs = embedding_model.encode(answers, normalize_embeddings=True, show_progress_bar=False)
        ctx_embs = embedding_model.encode(contexts, normalize_embeddings=True, show_progress_bar=False)
        # Row-wise dot product of normalized vectors
        cos_sims = np.sum(ans_embs * ctx_embs, axis=1)
    else:
        cos_sims = [0.0] * len(eval_logs)

    for i, item in enumerate(eval_logs):
        question = item.get("question", "")
        answer = item.get("generated_answer", "")
        retrieved_chunks = item.get("retrieved_chunks", [])
        combined_context = " ".join([c.get("text", "") for c in retrieved_chunks])
        query_type = item.get("query_type", "in-corpus")

        # Feature 1: Cosine similarity
        cos_sim = float(cos_sims[i])

        # Feature 2: Lexical overlap ratio
        lex_overlap = compute_lexical_overlap(answer, combined_context)

        # Feature 3: Binary relevant drug retrieved
        rel_drug = check_relevant_drug_retrieved(question, retrieved_chunks)

        # Feature 4: Answer length in words
        words = answer.strip().split()
        ans_len = len(words)

        # Feature 5: Hedging word count
        hedge_cnt = count_hedging_words(answer)

        # Feature 6: Query type
        records.append({
            "id": item.get("id", i + 1),
            "question": question,
            "query_type": query_type,
            "generated_answer": answer,
            "cosine_similarity": round(cos_sim, 4),
            "lexical_overlap_ratio": round(lex_overlap, 4),
            "relevant_drug_retrieved": rel_drug,
            "answer_length_words": ans_len,
            "hedging_count": hedge_cnt,
            "label": item.get("label", None)  # left null/blank for manual review
        })

    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    import argparse
    import sys

    if str(BASE_DIR) not in sys.path:
        sys.path.insert(0, str(BASE_DIR))

    default_logs = str(BASE_DIR / "eval" / "rag_eval_logs.json")
    default_out = str(BASE_DIR / "eval" / "rag_features_unlabeled.csv")

    parser = argparse.ArgumentParser(description="Extract features from RAG evaluation logs")
    parser.add_argument("--logs", type=str, default=default_logs, help="Input logs JSON file")
    parser.add_argument("--out", type=str, default=default_out, help="Output CSV file")
    args = parser.parse_args()

    if os.path.exists(args.logs):
        with open(args.logs, "r", encoding="utf-8") as f:
            data = json.load(f)
        from py_src.rag_pipeline import get_embedding_model
        model = get_embedding_model()
        df = extract_features(data, embedding_model=model)
        df.to_csv(args.out, index=False, encoding="utf-8")
        print(f"Features saved to {args.out} with shape {df.shape}")
        print("Columns:", list(df.columns))
    else:
        print(f"File {args.logs} not found. Run Part 2 & Part 3 first.")
