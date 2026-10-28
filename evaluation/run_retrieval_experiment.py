from __future__ import annotations
import csv
import json
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND))
from database import init_db
from services.retrieval import search

def main():
    init_db(); dataset = Path(__file__).with_name("gold_standard.csv")
    if not dataset.exists(): raise SystemExit("Copy gold_standard_template.csv to gold_standard.csv and verify every row first.")
    rows = list(csv.DictReader(dataset.open(encoding="utf-8-sig")))
    output = []
    for mode in ("semantic", "hybrid", "revision_aware"):
        hits = revisions = 0; latencies = []
        for row in rows:
            results, latency = search(row["question"], mode=mode, top_k=3); latencies.append(latency)
            expected = row["expected_document"].casefold(); revision = row["expected_revision"].casefold()
            hits += int(bool(expected) and any(expected == item["document_title"].casefold() for item in results))
            revisions += int(bool(revision) and any(expected == item["document_title"].casefold() and revision == item["revision"].casefold() for item in results))
        output.append({"mode": mode, "questions": len(rows), "hit_at_3": hits / len(rows), "correct_revision_at_3": revisions / len(rows), "mean_retrieval_ms": sum(latencies) / len(latencies)})
    print(json.dumps(output, indent=2))

if __name__ == "__main__": main()

