import os
import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
EVAL_DIR = BASE_DIR / "eval"
DEFAULT_CSV = str(EVAL_DIR / "rag_features_labeled.csv")


def load_and_preprocess_data(csv_path: str):
    """
    Load feature dataset, filter labeled rows, encode categorical query_type,
    and return feature matrix X, labels y, and feature column names.
    """
    df = pd.read_csv(csv_path)

    # Check for label column
    if "label" not in df.columns:
        raise ValueError("Missing 'label' column in dataset.")

    # Filter out unlabeled/null rows
    df_labeled = df.dropna(subset=["label"]).copy()
    df_labeled = df_labeled[df_labeled["label"].str.strip() != ""]

    if len(df_labeled) == 0:
        raise ValueError("No labeled samples found in the dataset! Please populate 'label' first.")

    # Encode query_type via one-hot encoding
    df_encoded = pd.get_dummies(df_labeled, columns=["query_type"], drop_first=False)

    feature_cols = [
        "cosine_similarity",
        "lexical_overlap_ratio",
        "relevant_drug_retrieved",
        "answer_length_words",
        "hedging_count"
    ]

    # Add query_type one-hot columns if present
    for col in df_encoded.columns:
        if col.startswith("query_type_"):
            feature_cols.append(col)

    X = df_encoded[feature_cols].values
    y = df_labeled["label"].values

    return X, y, feature_cols, df_labeled


def train_and_evaluate(csv_path: str = None, save_models: bool = True):
    """
    Train Logistic Regression & Random Forest classifiers using 5-fold Stratified CV.
    Reports accuracy, F1 per class, confusion matrix, and feature importances.
    """
    if csv_path is None:
        csv_path = DEFAULT_CSV
    print(f"Loading data from {csv_path}...")
    X, y, feature_names, df_labeled = load_and_preprocess_data(csv_path)

    classes = np.unique(y)
    print(f"Dataset shape: {X.shape}, Classes ({len(classes)}): {list(classes)}")
    print(f"Class distribution:\n{df_labeled['label'].value_counts()}\n")

    # 5-fold Stratified Cross-Validation
    n_splits = min(5, min(df_labeled["label"].value_counts()))
    if n_splits < 2:
        n_splits = 2
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # -----------------------------
    # 1. Logistic Regression
    # -----------------------------
    print("=" * 60)
    print(f"1. LOGISTIC REGRESSION ({n_splits}-Fold Stratified Cross-Validation)")
    print("=" * 60)
    lr = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)
    lr_preds = cross_val_predict(lr, X_scaled, y, cv=skf)

    lr_acc = accuracy_score(y, lr_preds)
    lr_f1_macro = f1_score(y, lr_preds, average="macro")
    print(f"Overall Accuracy: {lr_acc:.4f}")
    print(f"Macro F1-Score:   {lr_f1_macro:.4f}\n")
    print("Classification Report:")
    print(classification_report(y, lr_preds, zero_division=0))
    print("Confusion Matrix:")
    print(confusion_matrix(y, lr_preds, labels=classes))
    print()

    # -----------------------------
    # 2. Random Forest Classifier
    # -----------------------------
    print("=" * 60)
    print(f"2. RANDOM FOREST CLASSIFIER ({n_splits}-Fold Stratified Cross-Validation)")
    print("=" * 60)
    rf = RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42)
    rf_preds = cross_val_predict(rf, X, y, cv=skf)

    rf_acc = accuracy_score(y, rf_preds)
    rf_f1_macro = f1_score(y, rf_preds, average="macro")
    print(f"Overall Accuracy: {rf_acc:.4f}")
    print(f"Macro F1-Score:   {rf_f1_macro:.4f}\n")
    print("Classification Report:")
    print(classification_report(y, rf_preds, zero_division=0))
    print("Confusion Matrix:")
    print(confusion_matrix(y, rf_preds, labels=classes))
    print()

    # Fit Random Forest on full dataset to inspect feature importances
    rf.fit(X, y)
    importances = rf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]

    print("=" * 60)
    print("RANDOM FOREST FEATURE IMPORTANCES:")
    print("=" * 60)
    for rank, idx in enumerate(sorted_idx, 1):
        print(f"{rank:2d}. {feature_names[idx]:<28} : {importances[idx] * 100:6.2f}%")
    print("=" * 60)

    if save_models:
        lr.fit(X_scaled, y)
        rf_path = str(MODELS_DIR / "rf_classifier.joblib")
        lr_path = str(MODELS_DIR / "lr_classifier.joblib")
        scaler_path = str(MODELS_DIR / "scaler.joblib")
        feat_path = str(MODELS_DIR / "feature_names.json")

        joblib.dump(rf, rf_path)
        joblib.dump(lr, lr_path)
        joblib.dump(scaler, scaler_path)
        with open(feat_path, "w", encoding="utf-8") as f:
            json.dump(feature_names, f, indent=2)
        print(f"\nSaved trained models to {MODELS_DIR}: rf_classifier.joblib, lr_classifier.joblib, scaler.joblib")

    return {
        "lr_accuracy": lr_acc,
        "lr_f1_macro": lr_f1_macro,
        "rf_accuracy": rf_acc,
        "rf_f1_macro": rf_f1_macro,
        "feature_importances": {feature_names[i]: float(importances[i]) for i in sorted_idx}
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train Hallucination Classifiers")
    parser.add_argument("--csv", type=str, default=DEFAULT_CSV, help="Labeled features CSV")
    args = parser.parse_args()

    if os.path.exists(args.csv):
        train_and_evaluate(args.csv)
    else:
        print(f"File {args.csv} does not exist yet. Please run feature extraction and labeling first.")
