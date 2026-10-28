# Small manufacturing RAG experiment

The experiment compares `semantic`, `hybrid`, and `revision_aware` retrieval modes using the same indexed document collection and frozen question set.

## Dataset fields

- `question_id`: stable identifier
- `question`: user query
- `expected_document`: relevant document title
- `expected_revision`: relevant revision
- `expected_page`: relevant page when known
- `answerable`: `1` when the corpus supports an answer, otherwise `0`
- `reference_answer`: manually verified answer used only for evaluation

## Primary metrics

- Hit@3
- correct-revision@3
- answerability accuracy
- citation accuracy
- retrieval latency

Do not add results to the paper until the question set, documents, and scoring have been manually verified.

