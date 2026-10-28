# Local RAG for Manufacturing Knowledge Assistance

A local, privacy-preserving Retrieval-Augmented Generation (RAG) prototype for searching and answering questions from manufacturing documents.

## Research scope

The system can ingest work standards, process instructions, manuals, and specifications; retrieve relevant passages; generate grounded answers with page-level citations; distinguish active and historical revisions; and reject unsupported questions.

## Architecture

- **Frontend:** Next.js and TypeScript
- **Backend:** Python and Flask
- **Retrieval:** semantic search, BM25, and revision-aware ranking
- **Generation:** local LLM through Ollama
- **Storage:** local SQLite metadata, chunks, and embeddings

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
```

The first indexing request downloads the configured embedding model. Install Ollama separately and pull the model declared in `.env.example` to enable generated answers. If Ollama is unavailable, the API transparently returns the strongest retrieved evidence.

### Frontend

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`, upload an approved PDF, DOCX, or TXT document, and ask a question.

## Minimum experiment

The initial experiment compares semantic-only, hybrid, and revision-aware hybrid retrieval. Metrics include Hit@3, correct-revision@3, answerability accuracy, citation accuracy, and retrieval latency.

1. Index the frozen manufacturing document collection.
2. Copy `evaluation/gold_standard_template.csv` to `evaluation/gold_standard.csv`.
3. Manually verify every expected document, revision, page, and reference answer.
4. Run `python evaluation/run_retrieval_experiment.py`.

Do not report illustrative template values as empirical results.

## Data policy

Never commit company documents, credentials, uploads, local databases, vector indexes, model files, private evaluation keys, or confidential experiment outputs. Synthetic or explicitly approved samples may be stored under `examples/`.
