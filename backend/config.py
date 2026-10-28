from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.getenv("RAG_DATA_DIR", BASE_DIR.parent / "data-private")).resolve()
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "manufacturing_rag.db"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:8b")
ANSWERABILITY_THRESHOLD = float(os.getenv("ANSWERABILITY_THRESHOLD", "0.35"))
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

