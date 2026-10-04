import os
import re
import json
from datetime import datetime
import numpy as np
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
EVAL_DIR = BASE_DIR / "eval"

# Load environment variables from .env if present
load_dotenv(BASE_DIR / ".env")

CORPUS_FILE = str(DATA_DIR / "drugs_corpus.json")
EMBEDDINGS_FILE = str(DATA_DIR / "embeddings.npy")
LOGS_FILE = str(EVAL_DIR / "rag_logs.json")
DEFAULT_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"
DEFAULT_LLM = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")

_model = None
_corpus = None
_embeddings = None


def format_drug_chunk(drug: dict) -> str:
    """Format a drug JSON record into a comprehensive text chunk for embedding & context."""
    return (
        f"ওষুধের নাম: {drug.get('name', '')}\n"
        f"ডোজ বা ব্যবহারবিধি: {drug.get('dosage', '')}\n"
        f"যেসব ক্ষেত্রে সেবন নিষেধ (Contraindications): {drug.get('contraindications', '')}\n"
        f"গর্ভাবস্থায় ব্যবহারের ঝুঁকি ও সতর্কতা: {drug.get('pregnancy_warning', '')}\n"
        f"স্তন্যদানকালে ব্যবহারের ঝুঁকি ও সতর্কতা: {drug.get('lactation_warning', '')}\n"
        f"পার্শ্বপ্রতিক্রিয়া: {drug.get('side_effects', '')}"
    )


def get_embedding_model(model_name: str = DEFAULT_MODEL):
    """Lazy-load the multilingual SentenceTransformer embedding model."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        print(f"Loading embedding model: {model_name}...")
        _model = SentenceTransformer(model_name)
    return _model


def load_corpus(corpus_path: str = CORPUS_FILE) -> list:
    """Load the JSON drug knowledge base."""
    global _corpus
    if _corpus is None:
        with open(corpus_path, "r", encoding="utf-8") as f:
            _corpus = json.load(f)
    return _corpus


def build_or_load_index(corpus_path: str = CORPUS_FILE, embeddings_path: str = EMBEDDINGS_FILE):
    """
    Build or load pre-computed normalized embeddings for the drug corpus.
    Cosine similarity is computed via dot-product on normalized vectors.
    """
    global _embeddings
    corpus = load_corpus(corpus_path)

    if os.path.exists(embeddings_path):
        print(f"Loading cached embeddings from {embeddings_path}...")
        _embeddings = np.load(embeddings_path)
    else:
        print("Computing embeddings for drug knowledge base...")
        model = get_embedding_model()
        chunks = [format_drug_chunk(drug) for drug in corpus]
        embeddings = model.encode(chunks, show_progress_bar=False, normalize_embeddings=True)
        _embeddings = np.array(embeddings, dtype=np.float32)
        np.save(embeddings_path, _embeddings)
        print(f"Embeddings saved to {embeddings_path} (shape: {_embeddings.shape})")

    return corpus, _embeddings


def retrieve(query: str, top_k: int = 3, corpus_path: str = CORPUS_FILE, embeddings_path: str = EMBEDDINGS_FILE):
    """
    Retrieve top-k most relevant drug chunks for a Bengali query using
    hybrid scoring: cosine similarity + lexical matching for specified drug names.
    """
    corpus, embeddings = build_or_load_index(corpus_path, embeddings_path)
    model = get_embedding_model()

    # Compute query embedding and normalize
    query_emb = model.encode([query], normalize_embeddings=True)[0]

    # Cosine similarity is dot-product of normalized vectors
    dense_similarities = np.dot(embeddings, query_emb)

    q_lower = query.lower()
    combined_scores = []
    for idx, drug in enumerate(corpus):
        name = drug.get("name", "").lower()
        brands = drug.get("brand_names", "").lower()
        full_search = f"{name} {brands}"
        # Clean tokens to match drug mentions
        terms = [re.sub(r"[^\w\u0980-\u09FF]", "", w) for w in full_search.split()]
        terms = [t for t in terms if len(t) >= 3]
        lexical_boost = 0.75 if any(t in q_lower for t in terms) else 0.0
        final_score = float(dense_similarities[idx] + lexical_boost)
        combined_scores.append((final_score, idx))

    # Sort descending by combined score
    combined_scores.sort(key=lambda x: x[0], reverse=True)
    top_items = combined_scores[:top_k]

    results = []
    for score, idx in top_items:
        drug = corpus[idx]
        results.append({
            "id": drug.get("id"),
            "name": drug.get("name"),
            "similarity_score": round(score, 4),
            "dense_score": round(float(dense_similarities[idx]), 4),
            "chunk_text": format_drug_chunk(drug),
            "raw_drug": drug
        })
    return results


def construct_prompt(query: str, retrieved_chunks: list) -> str:
    """
    Construct a prompt enforcing strict context grounding in Bengali.
    """
    context_str = "\n\n---\n\n".join(
        [f"[তথ্য {i+1}]:\n{chunk['chunk_text']}" for i, chunk in enumerate(retrieved_chunks)]
    )

    prompt = f"""আপনি একজন দায়িত্বশীল এবং সঠিক তথ্য প্রদানকারী চিকিৎসা সহকারী।
নিচে গর্ভবতী এবং স্তন্যদানকারী মায়েদের ওষুধের নিরাপত্তা বিষয়ক একটি সহায়ক তথ্যভাণ্ডার (Context) দেওয়া হলো।

নির্দেশনা:
১. শুধুমাত্র নিচের প্রদত্ত তথ্যভাণ্ডার (Context) ব্যবহার করে সম্পূর্ণ বাংলায় প্রশ্নের উত্তর দিন।
২. প্রদত্ত তথ্যের বাইরে কোনো কাল্পনিক বা অনুমানভিত্তিক তথ্য যোগ করবেন না।
৩. যদি প্রদত্ত তথ্যে কোনো নির্দিষ্ট ওষুধ বা প্রশ্নের স্পষ্ট উল্লেখ না থাকে, তবে সুস্পষ্টভাবে জানান যে: "প্রদত্ত তথ্যে এই বিষয়ে নিশ্চিত কোনো তথ্য পাওয়া যায়নি। অনুগ্রহ করে একজন নিবন্ধিত চিকিৎসকের (MBBS/বিশেষজ্ঞ) পরামর্শ নিন।"
৪. উত্তর সংক্ষিপ্ত, স্পষ্ট এবং চিকিৎসাগতভাবে সতর্ক রাখুন।

তথ্যভাণ্ডার (Context):
{context_str}

প্রশ্ন:
{query}

বাংলায় উত্তর:"""
    return prompt


def generate_answer_gemini(prompt: str, model: str = None) -> str:
    """
    Call Google Gemini API to generate a grounded Bengali answer.
    """
    from google import genai
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "").strip()
    if not api_key:
        raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY environment variable is not set.")

    client = genai.Client(api_key=api_key)
    models_to_try = [
        model,
        os.getenv("GEMINI_MODEL"),
        "gemini-3.8-flash",
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-flash-latest"
    ]
    models_to_try = [m for m in dict.fromkeys(models_to_try) if m]

    last_err = None
    for m in models_to_try:
        try:
            response = client.models.generate_content(
                model=m,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            last_err = e
            print(f"Gemini model {m} error ({e}). Trying next fallback model...")

    raise last_err


def generate_answer(prompt: str, model: str = None, allow_offline_fallback: bool = True) -> str:
    """
    Generate grounded Bengali answer using Gemini API (or Anthropic API as alternative).
    If no API key is provided and allow_offline_fallback is True, generates context-grounded demo response.
    """
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "").strip()
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "").strip()

    # 1. Try Gemini API first (Primary)
    if gemini_key and gemini_key != "":
        try:
            return generate_answer_gemini(prompt, model=model)
        except Exception as e:
            print(f"Gemini API error: {e}")

    # 2. Try Anthropic API if key is present
    if anthropic_key and anthropic_key != "" and "your_anthropic" not in anthropic_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key)
            anthropic_model = model or os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
            response = client.messages.create(
                model=anthropic_model,
                max_tokens=600,
                temperature=0.0,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text.strip()
        except Exception as e:
            print(f"Anthropic API error: {e}")

    # 3. Context-grounded offline fallback mode if no API key is set
    if allow_offline_fallback:
        print("\n[NOTE] GEMINI_API_KEY is not set yet in .env. Generating context-grounded response in demonstration mode.")
        print("To use live Gemini API, please add your key to .env: GEMINI_API_KEY=your_key\n")
        if "তথ্যভাণ্ডার (Context):" in prompt:
            ctx_part = prompt.split("তথ্যভাণ্ডার (Context):")[1].split("প্রশ্ন:")[0].strip()
            # If query is about an in-corpus drug, extract verified facts
            lines = [l.strip() for l in ctx_part.split("\n") if l.strip().startswith("গর্ভাবস্থায়") or l.strip().startswith("স্তন্যদানকালে")]
            if lines and "তথ্য পাওয়া যায়নি" not in ctx_part:
                return f"[Gemini Grounded Demo]: {lines[0]} অতিরিক্ত তথ্যের জন্য সর্বদা নিবন্ধিত চিকিৎসকের পরামর্শ নিন।"
        return "প্রদত্ত তথ্যে এই বিষয়ে নিশ্চিত কোনো তথ্য পাওয়া যায়নি। অনুগ্রহ করে একজন নিবন্ধিত চিকিৎসকের (MBBS/বিশেষজ্ঞ) পরামর্শ নিন।"

    raise ValueError("Neither GEMINI_API_KEY nor ANTHROPIC_API_KEY is configured in your environment or .env file.")


def generate_direct_llm_answer(query: str, model: str = None) -> str:
    """
    Generate an unconstrained direct LLM answer for the same question
    with NO retrieved context and NO restrictive grounding prompt.
    """
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "").strip()
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "").strip()

    last_error = None

    # 1. Try Gemini API directly without grounding context
    if gemini_key and gemini_key != "":
        candidate_models = [model] if model else [
            os.getenv("GEMINI_MODEL"),
            "gemini-3.8-flash",
            "gemini-3.5-flash",
            "gemini-2.5-flash",
            "gemini-flash-latest"
        ]
        candidate_models = [m for m in dict.fromkeys(candidate_models) if m]

        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            for m in candidate_models:
                try:
                    response = client.models.generate_content(
                        model=m,
                        contents=f"নিচের চিকিৎসা বিষয়ক প্রশ্নের সরাসরি বাংলায় উত্তর দিন:\n\n{query}"
                    )
                    return response.text.strip()
                except Exception as m_err:
                    last_error = str(m_err)
                    print(f"Direct Gemini API error with model {m}: {m_err}")
                    if "403" in last_error or "400" in last_error or "INVALID" in last_error:
                        # Auth/Key issue, other models won't succeed either
                        break
        except Exception as e:
            last_error = str(e)
            print(f"Direct Gemini client initialization error: {e}")

    # 2. Try Anthropic API directly without grounding context
    if anthropic_key and anthropic_key != "" and "your_anthropic" not in anthropic_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key)
            anthropic_model = model or os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
            response = client.messages.create(
                model=anthropic_model,
                max_tokens=600,
                messages=[{"role": "user", "content": f"নিচের চিকিৎসা বিষয়ক প্রশ্নের সরাসরি বাংলায় উত্তর দিন:\n\n{query}"}]
            )
            return response.content[0].text.strip()
        except Exception as e:
            print(f"Direct Anthropic API error: {e}")

    # 3. If an API key was provided but failed, show specific reason
    if last_error:
        if "403" in last_error:
            return "LLM comparison unavailable (Gemini API 403: Project denied access or restricted key)"
        if "400" in last_error or "API_KEY_INVALID" in last_error:
            return "LLM comparison unavailable (Gemini API 400: API key is invalid)"
        return f"LLM comparison unavailable (Gemini API error: {last_error[:60]})"

    # 4. If no LLM API key is available
    return "LLM comparison unavailable (API key not set)"


def log_interaction(record: dict, log_file: str = LOGS_FILE):
    """
    Append or update logged interactions in JSON file.
    """
    logs = []
    if os.path.exists(log_file):
        try:
            with open(log_file, "r", encoding="utf-8") as f:
                logs = json.load(f)
        except Exception:
            logs = []

    logs.append(record)
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(logs, f, ensure_ascii=False, indent=2)


def run_rag_pipeline(query: str, top_k: int = 3, log_file: str = LOGS_FILE, model: str = DEFAULT_LLM) -> dict:
    """
    End-to-end RAG pipeline:
    1. Retrieve relevant chunks
    2. Construct grounded prompt
    3. Generate LLM answer
    4. Log the interaction
    """
    retrieved = retrieve(query, top_k=top_k)
    prompt = construct_prompt(query, retrieved)
    answer = generate_answer(prompt, model=model)

    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "question": query,
        "retrieved_chunks": [
            {
                "id": c["id"],
                "name": c["name"],
                "similarity_score": c["similarity_score"],
                "text": c["chunk_text"]
            }
            for c in retrieved
        ],
        "generated_answer": answer
    }

    if log_file:
        log_interaction(log_entry, log_file=log_file)

    return log_entry


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Bangla Drug Safety RAG Pipeline")
    parser.add_argument("--query", type=str, default="গর্ভাবস্থায় প্যারাসিটামল খাওয়া কি নিরাপদ?", help="Bengali query")
    parser.add_argument("--top_k", type=int, default=3, help="Top K chunks")
    args = parser.parse_args()

    print(f"Testing Query: {args.query}\n")
    try:
        result = run_rag_pipeline(args.query, top_k=args.top_k)
        print("Generated Answer:\n", result["generated_answer"])
        print("\nTop Retrieved Drug:", result["retrieved_chunks"][0]["name"], 
              f"(Score: {result['retrieved_chunks'][0]['similarity_score']:.4f})")
    except Exception as err:
        print("Error running pipeline:", err)
