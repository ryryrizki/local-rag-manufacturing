"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, Send, Upload } from "lucide-react";

type Source = { document_title: string; revision: string; page: number; score: number; status: string };
type Answer = { answer: string; answerable: boolean; sources: Source[] };
const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`${API}/api/query`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, mode: "revision_aware" }) });
      if (!response.ok) throw new Error(await response.text());
      setResult(await response.json());
    } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed"); }
    finally { setLoading(false); }
  }

  async function upload(file: File) {
    const data = new FormData(); data.append("file", file); data.append("status", "active"); data.append("revision", "1.0");
    setMessage("Indexing document...");
    try {
      const response = await fetch(`${API}/api/documents`, { method: "POST", body: data });
      if (!response.ok) throw new Error(await response.text());
      const body = await response.json(); setMessage(`Indexed ${body.chunk_count} chunks from ${body.document_title}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed"); }
  }

  return <main className="min-h-screen bg-slate-100 p-4 md:p-8"><div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border bg-white shadow-sm">
    <header className="flex items-center justify-between border-b px-6 py-4"><div className="flex items-center gap-3"><Link href="/" aria-label="Back"><ArrowLeft size={20}/></Link><div><h1 className="font-semibold">Precision AI Copilot</h1><p className="text-xs text-slate-400">Revision-aware manufacturing RAG</p></div></div><label className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"><Upload size={16}/> Add document<input className="hidden" type="file" accept=".pdf,.docx,.txt" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}/></label></header>
    <div className="grid min-h-[650px] md:grid-cols-[1fr_360px]"><section className="flex flex-col p-6"><div className="flex-1 space-y-4"><div className="max-w-2xl rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">Ask about approved manufacturing procedures, specifications, and work standards. The system prioritizes active revisions and shows its evidence.</div>{result && <div className="max-w-2xl rounded-xl border border-blue-100 bg-blue-50 p-5"><div className="mb-2 text-xs font-semibold uppercase text-blue-600">AI Copilot</div><p className="whitespace-pre-wrap leading-7">{result.answer}</p></div>}{message && <p className="text-sm text-amber-700">{message}</p>}</div>
      <form onSubmit={ask} className="mt-6 flex gap-3 rounded-xl border p-3"><textarea value={question} onChange={(e)=>setQuestion(e.target.value)} rows={2} className="flex-1 resize-none p-2 outline-none" placeholder="Ask a manufacturing question..."/><button disabled={loading} className="self-end rounded-lg bg-blue-600 p-3 text-white disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}</button></form></section>
      <aside className="border-l bg-slate-50 p-5"><h2 className="font-semibold">Top sources</h2><div className="mt-4 space-y-3">{result?.sources.length ? result.sources.map((source, index)=><div key={`${source.document_title}-${index}`} className="rounded-xl border bg-white p-4 text-sm"><div className="font-medium">{source.document_title}</div><div className="mt-2 text-xs text-slate-500">Rev. {source.revision} · p.{source.page} · {source.status}</div><div className="mt-1 text-xs text-blue-600">Score {source.score.toFixed(3)}</div></div>) : <p className="text-sm text-slate-400">Sources will appear after a question.</p>}</div></aside></div>
  </div></main>;
}

