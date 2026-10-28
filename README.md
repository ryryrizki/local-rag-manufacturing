# Local RAG for Manufacturing Knowledge Assistance

A local, privacy-preserving Retrieval-Augmented Generation (RAG) prototype for searching and answering questions from manufacturing documents.

## Research scope

The system is designed to:

- ingest work standards, process instructions, manuals, and product specifications;
- retrieve relevant passages using semantic and keyword search;
- generate grounded answers with page-level citations;
- distinguish active and historical document revisions;
- reject questions unsupported by indexed documents; and
- run locally so internal knowledge remains on the operator's machine.

## Planned architecture

- **Frontend:** Next.js and TypeScript
- **Backend:** Python API
- **Retrieval:** semantic search, BM25, and reranking
- **Generation:** local LLM through Ollama
- **Storage:** local metadata, document chunks, and vector index

## Minimum experiment

The initial study compares:

1. semantic-only retrieval;
2. hybrid semantic + BM25 retrieval; and
3. revision-aware hybrid retrieval.

An initial set of approximately 15 manufacturing questions will be evaluated using Hit@3, answer accuracy, correct-revision rate, citation accuracy, unsupported-query rejection, and response latency.

## Data policy

Do not commit company documents, credentials, uploaded files, local databases, vector indexes, model files, private evaluation keys, or confidential experiment output.

Synthetic or explicitly approved sample documents may be stored under `examples/`.

## Status

Repository initialized for the manufacturing RAG migration.
