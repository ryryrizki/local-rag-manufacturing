from __future__ import annotations
import json
import re
import time
import numpy as np
from rank_bm25 import BM25Okapi
from database import connect
from services.embeddings import embed

TOKEN = re.compile(r"[A-Za-z0-9]+|[가-힣]+")
def tokenize(text: str): return [token.casefold() for token in TOKEN.findall(text)]
def normalize(values: np.ndarray):
    low, high = float(values.min()), float(values.max())
    return np.ones_like(values) if high == low and high > 0 else (values - low) / (high - low) if high > low else np.zeros_like(values)

def search(question: str, mode: str = "revision_aware", top_k: int = 3):
    started = time.perf_counter()
    with connect() as connection:
        rows = [dict(row) for row in connection.execute("""SELECT c.id, c.content, c.page, c.embedding, d.title AS document_title, d.revision, d.status, d.effective_date FROM chunks c JOIN documents d ON d.id = c.document_id""").fetchall()]
    if not rows: return [], 0.0
    query = np.asarray(embed([question])[0], dtype=float)
    matrix = np.asarray([json.loads(row["embedding"]) for row in rows], dtype=float)
    semantic = matrix @ query
    bm25 = BM25Okapi([tokenize(row["content"]) for row in rows])
    lexical = np.asarray(bm25.get_scores(tokenize(question)), dtype=float)
    if mode == "semantic": score = semantic
    else: score = 0.7 * normalize(semantic) + 0.3 * normalize(lexical)
    if mode == "revision_aware":
        score = score + np.asarray([0.08 if row["status"].casefold() == "active" else -0.05 for row in rows])
    order = np.argsort(score)[::-1][:top_k]
    results = []
    for index in order:
        item = rows[int(index)]; item.pop("embedding", None); item["score"] = float(score[index]); results.append(item)
    return results, (time.perf_counter() - started) * 1000

