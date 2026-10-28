import requests
from config import OLLAMA_BASE_URL, OLLAMA_MODEL

def generate(question: str, sources: list[dict]) -> str:
    context = "\n\n".join(f"[Source {i}: {s['document_title']}, revision {s['revision']}, page {s['page']}, status {s['status']}]\n{s['content']}" for i, s in enumerate(sources, 1))
    prompt = f"""You are a manufacturing knowledge assistant. Answer only from the supplied sources. Prefer active revisions. If evidence conflicts, explain which revision is active. Cite sources as [Source N]. Do not invent values.\n\nQuestion: {question}\n\nSources:\n{context}\n\nAnswer:"""
    try:
        response = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}, timeout=120)
        response.raise_for_status()
        return response.json()["response"].strip()
    except requests.RequestException:
        best = sources[0]
        return f"Local LLM unavailable. Most relevant evidence: {best['content']} [{best['document_title']}, Rev. {best['revision']}, p.{best['page']}]"

