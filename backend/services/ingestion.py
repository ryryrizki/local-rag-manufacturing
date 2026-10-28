from __future__ import annotations
import hashlib
import json
import re
from pathlib import Path
from uuid import uuid4
import fitz
from docx import Document
from werkzeug.datastructures import FileStorage
from config import ALLOWED_EXTENSIONS, UPLOAD_DIR
from database import connect, transaction
from services.embeddings import embed

def extract_pages(path: Path) -> list[tuple[int, str]]:
    if path.suffix.lower() == ".pdf":
        with fitz.open(path) as pdf:
            return [(i + 1, page.get_text("text")) for i, page in enumerate(pdf)]
    if path.suffix.lower() == ".docx":
        text = "\n".join(p.text for p in Document(path).paragraphs if p.text.strip())
        return [(1, text)]
    return [(1, path.read_text(encoding="utf-8", errors="ignore"))]

def chunks(text: str, size: int = 900, overlap: int = 150) -> list[str]:
    clean = re.sub(r"\s+", " ", text).strip()
    if not clean: return []
    output, start = [], 0
    while start < len(clean):
        end = min(start + size, len(clean))
        if end < len(clean):
            boundary = clean.rfind(" ", start, end)
            if boundary > start + size // 2: end = boundary
        output.append(clean[start:end].strip())
        if end == len(clean): break
        start = max(end - overlap, start + 1)
    return output

def ingest(file: FileStorage, *, title: str | None, revision: str, status: str, effective_date: str | None):
    filename = file.filename or "document"
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS: raise ValueError("Supported formats: PDF, DOCX, and TXT.")
    payload = file.read(); digest = hashlib.sha256(payload).hexdigest()
    with connect() as connection:
        existing = connection.execute("SELECT id, title FROM documents WHERE sha256 = ?", (digest,)).fetchone()
        if existing: return {"document_id": existing["id"], "document_title": existing["title"], "chunk_count": 0, "duplicate": True}
    stored = UPLOAD_DIR / f"{uuid4().hex}{extension}"; stored.write_bytes(payload)
    pages = extract_pages(stored)
    prepared = [(page, part) for page, text in pages for part in chunks(text)]
    if not prepared: raise ValueError("No readable text was found in the document.")
    vectors = embed([part for _, part in prepared])
    with transaction() as connection:
        cursor = connection.execute("INSERT INTO documents(title, filename, revision, status, effective_date, sha256) VALUES (?, ?, ?, ?, ?, ?)", (title or Path(filename).stem, filename, revision, status, effective_date, digest))
        document_id = cursor.lastrowid
        connection.executemany("INSERT INTO chunks(document_id, page, chunk_index, content, embedding) VALUES (?, ?, ?, ?, ?)", [(document_id, page, index, content, json.dumps(vector)) for index, ((page, content), vector) in enumerate(zip(prepared, vectors))])
    return {"document_id": document_id, "document_title": title or Path(filename).stem, "chunk_count": len(prepared), "duplicate": False}

