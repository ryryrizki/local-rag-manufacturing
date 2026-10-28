from flask import Flask, jsonify, request
from flask_cors import CORS
from config import ANSWERABILITY_THRESHOLD
from database import init_db
from services.generation import generate
from services.ingestion import ingest
from services.retrieval import search

app = Flask(__name__)
CORS(app)
init_db()

@app.get("/api/health")
def health(): return jsonify({"status": "ok"})

@app.post("/api/documents")
def upload_document():
    if "file" not in request.files: return jsonify({"error": "file is required"}), 400
    try:
        result = ingest(request.files["file"], title=request.form.get("title"), revision=request.form.get("revision", "1.0"), status=request.form.get("status", "active"), effective_date=request.form.get("effective_date"))
        return jsonify(result), 200 if result["duplicate"] else 201
    except ValueError as error: return jsonify({"error": str(error)}), 400

@app.post("/api/query")
def query():
    payload = request.get_json(silent=True) or {}; question = str(payload.get("question", "")).strip()
    if not question: return jsonify({"error": "question is required"}), 400
    sources, retrieval_ms = search(question, mode=payload.get("mode", "revision_aware"), top_k=int(payload.get("top_k", 3)))
    if not sources or sources[0]["score"] < ANSWERABILITY_THRESHOLD:
        return jsonify({"answer": "The indexed documents do not provide sufficient evidence to answer this question.", "answerable": False, "sources": sources, "retrieval_ms": retrieval_ms})
    answer = generate(question, sources)
    public_sources = [{key: source[key] for key in ("document_title", "revision", "page", "score", "status")} for source in sources]
    return jsonify({"answer": answer, "answerable": True, "sources": public_sources, "retrieval_ms": retrieval_ms})

if __name__ == "__main__": app.run(host="0.0.0.0", port=5000, debug=True)

