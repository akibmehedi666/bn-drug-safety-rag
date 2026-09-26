import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src import rag_pipeline
from src.feature_engineering import extract_features
from eval.generate_eval_dataset import EVAL_QUESTIONS

EVAL_DIR = BASE_DIR / "eval"
LOGS_FILE = str(EVAL_DIR / "rag_eval_logs.json")
UNLABELED_FEATURES_FILE = str(EVAL_DIR / "rag_features_unlabeled.csv")
SEED_LABELED_FEATURES_FILE = str(EVAL_DIR / "rag_features_labeled.csv")


def run_full_evaluation(questions=EVAL_QUESTIONS, logs_file=LOGS_FILE, limit=None):
    """
    Run evaluation questions through the RAG pipeline and save logs.
    """
    print(f"Starting evaluation across {len(questions)} Bengali test questions...")
    eval_subset = questions[:limit] if limit else questions

    logs = []
    start_time = time.time()

    for idx, item in enumerate(eval_subset, 1):
        q_text = item["question"]
        q_type = item["query_type"]
        exp_drug = item.get("expected_drug")

        print(f"[{idx}/{len(eval_subset)}] [{q_type.upper()}] Query: {q_text}")

        # Run pipeline
        result = rag_pipeline.run_rag_pipeline(q_text, top_k=3, log_file=None)

        log_entry = {
            "id": item["id"],
            "timestamp": datetime.now().isoformat(),
            "question": q_text,
            "query_type": q_type,
            "expected_drug": exp_drug,
            "retrieved_chunks": result["retrieved_chunks"],
            "generated_answer": result["generated_answer"],
            "label": None  # left null/blank for manual labeling as required
        }
        logs.append(log_entry)

    with open(logs_file, "w", encoding="utf-8") as f:
        json.dump(logs, f, ensure_ascii=False, indent=2)

    elapsed = time.time() - start_time
    print(f"\nCompleted {len(logs)} evaluations in {elapsed:.2f}s.")
    print(f"Logged results saved to {logs_file}")

    # Extract features
    print("Extracting 6 engineered features...")
    emb_model = rag_pipeline.get_embedding_model()
    df_features = extract_features(logs, embedding_model=emb_model)
    df_features.to_csv(UNLABELED_FEATURES_FILE, index=False, encoding="utf-8")
    print(f"Unlabeled features saved to {UNLABELED_FEATURES_FILE} (Shape: {df_features.shape})")

    # Create seed labeled dataset for immediate ML demonstration
    create_seed_labeled_dataset(df_features, SEED_LABELED_FEATURES_FILE)

    return logs, df_features


def create_seed_labeled_dataset(df, out_path=SEED_LABELED_FEATURES_FILE):
    """
    Generate realistic seed labels ('faithful', 'hallucinated', 'partial')
    for initial ML model verification and training demonstration.
    The user can modify or replace these in rag_features_labeled.csv.
    """
    df_labeled = df.copy()
    labels = []

    for _, row in df_labeled.iterrows():
        q_type = row["query_type"]
        cos_sim = row["cosine_similarity"]
        rel_retrieved = row["relevant_drug_retrieved"]
        ans = str(row["generated_answer"])

        # Ground truth simulation logic based on RAG behavior:
        # 1. In-corpus questions where relevant drug was retrieved and context was matched -> faithful
        if q_type == "in-corpus" and rel_retrieved == 1:
            labels.append("faithful")
        # 2. Out-of-corpus questions:
        elif q_type == "out-of-corpus":
            if "প্রদত্ত তথ্যে এই বিষয়ে নিশ্চিত কোনো তথ্য পাওয়া যায়নি" in ans or "তথ্য নেই" in ans:
                labels.append("faithful")  # faithfully abstained
            elif cos_sim < 0.35 and rel_retrieved == 0:
                labels.append("hallucinated")
            else:
                labels.append("partial")
        # 3. Ambiguous / edge cases:
        else:
            if rel_retrieved == 1 and cos_sim > 0.45:
                labels.append("faithful")
            elif "পরামর্শ নিন" in ans or "তথ্য পাওয়া যায়নি" in ans:
                labels.append("partial")
            else:
                labels.append("hallucinated")

    df_labeled["label"] = labels
    df_labeled.to_csv(out_path, index=False, encoding="utf-8")
    print(f"Seed labeled features saved to {out_path} with distribution:\n{df_labeled['label'].value_counts()}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run RAG Evaluation & Feature Extraction")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of test questions")
    args = parser.parse_args()

    run_full_evaluation(limit=args.limit)
