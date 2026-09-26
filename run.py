"""
Root runner for Bangla Drug-Safety RAG Web Application.
Usage:
    python run.py
    # or: python app/app.py
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.app import app

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
