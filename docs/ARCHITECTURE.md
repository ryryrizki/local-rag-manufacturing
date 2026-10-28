# Architecture

1. The browser uploads PDF, DOCX, or TXT files with revision metadata.
2. The Python service extracts text, preserves page numbers where available, chunks the text, and creates local embeddings.
3. Retrieval combines semantic similarity with BM25 keyword evidence.
4. Revision-aware mode boosts active documents and penalizes superseded revisions.
5. An answerability threshold rejects unsupported questions.
6. Ollama generates an answer only from retrieved evidence and returns document, revision, and page citations.

All uploaded files, embeddings, and the SQLite database remain under `data-private/`, which is excluded from Git.

