"use client";

import {
  Bot, CircleHelp, Database, FileSearch, FileText, Files, Info, Loader2,
  MessageSquare, RefreshCw, Search, Send, Settings, Sparkles,
  ThumbsDown, ThumbsUp, Trash2, UploadCloud, X,
} from "lucide-react";
import { FormEvent, useRef, useState } from "react";

type Source = {
  chunk_id?: number;
  document_title: string;
  revision: string;
  page: number;
  score: number;
  semantic_similarity?: number;
  status: string;
  content?: string;
};

type Answer = {
  answer: string;
  answerable: boolean;
  sources: Source[];
  retrieval_ms?: number;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

type IndexedDocument = {
  id: number;
  title: string;
  filename: string;
  revision: string;
  status: string;
  effective_date?: string | null;
  created_at: string;
  chunk_count: number;
  page_count: number;
};

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const suggestedQuestions = [
  "What is the maximum permitted hydraulic pressure?",
  "Which work-standard revision is currently active?",
  "What should I do if the oil temperature exceeds 75°C?",
];

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [result, setResult] = useState<Answer | null>(null);
  const [selectedSource, setSelectedSource] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState<IndexedDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<"ready" | "checking" | "offline">("ready");
  const fileInput = useRef<HTMLInputElement>(null);

  async function ask(event?: FormEvent, suggested?: string) {
    event?.preventDefault();
    const prompt = (suggested ?? question).trim();
    if (!prompt || loading) return;
    setMessages((current) => [...current, { role: "user", content: prompt }]);
    setQuestion("");
    setActiveQuestion(prompt);
    setNotice("");
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, mode: "revision_aware" }),
      });
      if (!response.ok) throw new Error(await response.text());
      const body: Answer = await response.json();
      setResult(body);
      setSelectedSource(0);
      setMessages((current) => [...current, { role: "assistant", content: body.answer }]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The request failed.");
      setSystemStatus("offline");
    } finally {
      setLoading(false);
    }
  }

  async function upload(file: File) {
    const data = new FormData();
    const revisionFromFilename = file.name.match(/rev(?:ision)?[_\s-]*([0-9]+(?:\.[0-9]+)?)/i)?.[1];
    data.append("file", file);
    data.append("status", "active");
    data.append("revision", revisionFromFilename ?? "1.0");
    setNotice(`Indexing ${file.name}...`);
    try {
      const response = await fetch(`${API}/api/documents`, { method: "POST", body: data });
      if (!response.ok) throw new Error(await response.text());
      const body = await response.json();
      setNotice(body.duplicate
        ? `${body.document_title} is already indexed.`
        : `${body.document_title} indexed successfully (${body.chunk_count} chunks).`);
      setSystemStatus("ready");
      if (showDocuments) await openDocuments();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Document upload failed.");
      setSystemStatus("offline");
    }
  }

  async function initializeSystem() {
    setSystemStatus("checking");
    setNotice("Checking backend and local knowledge index...");
    try {
      const response = await fetch(`${API}/api/health`);
      if (!response.ok) throw new Error("Backend health check failed.");
      setSystemStatus("ready");
      setNotice("System is ready. Existing indexed documents are available.");
    } catch {
      setSystemStatus("offline");
      setNotice("Backend is offline. Start python app.py and try again.");
    }
  }

  async function openDocuments() {
    setShowDocuments(true);
    setDocumentsLoading(true);
    try {
      const response = await fetch(`${API}/api/documents`);
      if (!response.ok) throw new Error(await response.text());
      const body = await response.json();
      setDocuments(body.documents ?? []);
      setSystemStatus("ready");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load indexed documents.");
      setSystemStatus("offline");
    } finally {
      setDocumentsLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setResult(null);
    setQuestion("");
    setActiveQuestion("");
    setNotice("");
  }

  const activeSource = result?.sources[selectedSource];

  return (
    <main className="h-screen min-h-[680px] overflow-hidden bg-[#f2f5fa] text-slate-900">
      <div className="mx-auto flex h-full max-w-[1680px] bg-white shadow-[0_0_40px_rgba(15,23,42,0.06)]">
        <Sidebar onManageDocuments={openDocuments} />
        <section className="flex min-w-0 flex-1 flex-col">
          <TopBar status={systemStatus} onInitialize={initializeSystem} onUpload={() => fileInput.current?.click()} />
          <input
            ref={fileInput}
            className="hidden"
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
              event.target.value = "";
            }}
          />

          {showDocuments && (
            <DocumentLibrary
              documents={documents}
              loading={documentsLoading}
              onClose={() => setShowDocuments(false)}
              onUpload={() => fileInput.current?.click()}
            />
          )}

          <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(560px,1fr)_380px]">
            <section className="flex min-h-0 flex-col border-r border-slate-200 bg-white">
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Bot size={17} /></div>
                  <div><h1 className="text-sm font-semibold">AI Copilot</h1><p className="text-[11px] text-slate-400">Grounded manufacturing assistance</p></div>
                </div>
                <button type="button" onClick={clearChat} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"><Trash2 size={13} /> Clear chat</button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {messages.length === 0 ? (
                  <EmptyState onSelect={(value) => ask(undefined, value)} />
                ) : (
                  <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-4">
                    {messages.map((message, index) => <MessageBubble key={`${message.role}-${index}`} message={message} />)}
                    {loading && <div className="flex items-center gap-3 text-sm text-slate-500"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Loader2 className="animate-spin" size={16} /></div>Retrieving approved evidence...</div>}
                    {messages.at(-1)?.role === "assistant" && (
                      <div className="ml-11 flex items-center gap-1 text-slate-400">
                        <button type="button" aria-label="Helpful" className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-700"><ThumbsUp size={14} /></button>
                        <button type="button" aria-label="Not helpful" className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-700"><ThumbsDown size={14} /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="shrink-0 px-5 pb-5">
                {notice && <div className={`mb-2 rounded-lg border px-3 py-2 text-xs ${systemStatus === "offline" ? "border-rose-100 bg-rose-50 text-rose-700" : "border-blue-100 bg-blue-50 text-blue-700"}`}>{notice}</div>}
                <form onSubmit={(event) => ask(event)} className="mx-auto max-w-4xl">
                  <div className="flex items-end gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-[0_6px_24px_rgba(15,23,42,0.06)] focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
                    <textarea
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(); }
                      }}
                      rows={2}
                      className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-slate-400"
                      placeholder="Ask a question about manufacturing documents..."
                    />
                    <button type="submit" disabled={loading || !question.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200">
                      {loading ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
                    </button>
                  </div>
                  <p className="mt-2 text-center text-[10px] text-slate-400">Answers are generated from indexed documents. Always verify critical manufacturing decisions.</p>
                </form>
              </div>
            </section>

            <EvidencePanel
              result={result}
              activeSource={activeSource}
              selectedSource={selectedSource}
              query={activeQuestion}
              onSelectSource={setSelectedSource}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar({ onManageDocuments }: { onManageDocuments: () => void }) {
  return (
    <aside className="hidden w-[226px] shrink-0 flex-col bg-[#102b52] text-white lg:flex">
      <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-extrabold text-[#102b52]">HD</div>
        <div className="min-w-0"><div className="truncate text-sm font-semibold">Precision AI</div><div className="truncate text-[10px] text-blue-200/70">Manufacturing Copilot</div></div>
      </div>
      <nav className="flex-1 px-3 py-5 text-xs">
        <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-200/50">Main</p>
        <SidebarItem icon={<MessageSquare size={15} />} label="Chat" active />
        <p className="mb-2 mt-6 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-200/50">Knowledge</p>
        <SidebarItem icon={<Files size={15} />} label="Manage Documents" onClick={onManageDocuments} />
        <SidebarItem icon={<FileSearch size={15} />} label="Document Search" />
        <p className="mb-2 mt-6 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-200/50">System</p>
        <SidebarItem icon={<Info size={15} />} label="System Info" />
        <SidebarItem icon={<Settings size={15} />} label="Settings" />
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg bg-white/5 p-3"><div className="flex items-center gap-2 text-[11px] font-medium"><Database size={13} className="text-emerald-300" /> Local knowledge base</div><div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-blue-100/60"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Private and on-device</div></div>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition ${active ? "bg-blue-600 font-medium text-white shadow-sm" : "text-blue-100/70 hover:bg-white/10 hover:text-white"}`}>{icon}<span>{label}</span></button>;
}

function TopBar({ status, onInitialize, onUpload }: { status: "ready" | "checking" | "offline"; onInitialize: () => void; onUpload: () => void }) {
  const statusLabel = status === "checking" ? "Checking" : status === "offline" ? "Offline" : "Ready";
  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div><h2 className="text-base font-semibold">Manufacturing Knowledge Workspace</h2><p className="mt-0.5 text-xs text-slate-400">Revision-aware local retrieval and grounded answers</p></div>
      <div className="flex items-center gap-3">
        <button type="button" title="Help" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"><CircleHelp size={17} /></button>
        <div className="hidden items-center gap-2 text-xs sm:flex"><span className={`h-2 w-2 rounded-full ${status === "offline" ? "bg-rose-500" : status === "checking" ? "animate-pulse bg-amber-400" : "bg-emerald-500"}`} /><span className="text-slate-500">{statusLabel}</span></div>
        <button type="button" onClick={onUpload} className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 md:flex"><UploadCloud size={15} /> Add document</button>
        <button type="button" onClick={onInitialize} className="flex items-center gap-2 rounded-lg bg-[#102b52] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#173b6d]"><RefreshCw className={status === "checking" ? "animate-spin" : ""} size={14} /> Initialize system</button>
      </div>
    </header>
  );
}

function EmptyState({ onSelect }: { onSelect: (value: string) => void }) {
  return (
    <div className="flex h-full min-h-[360px] items-center justify-center"><div className="w-full max-w-lg text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Sparkles size={22} /></div>
      <h2 className="mt-4 text-lg font-semibold">How can I help?</h2><p className="mt-1 text-xs text-slate-400">Ask questions about approved manufacturing documents.</p>
      <div className="mt-6 space-y-2">{suggestedQuestions.map((item) => <button key={item} type="button" onClick={() => onSelect(item)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-xs text-slate-600 transition hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700"><span>{item}</span><Search size={13} className="text-slate-300" /></button>)}</div>
    </div></div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") return <div className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm leading-6 text-white shadow-sm">{message.content}</div>;
  return <div className="flex max-w-[92%] items-start gap-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Bot size={16} /></div><div className="rounded-2xl rounded-tl-md border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">{message.content}</div></div>;
}

function EvidencePanel({ result, activeSource, selectedSource, query, onSelectSource }: { result: Answer | null; activeSource?: Source; selectedSource: number; query: string; onSelectSource: (index: number) => void }) {
  const documentCount = result ? new Set(result.sources.map((source) => source.document_title)).size : 0;
  const evidenceSummary = result?.sources.length
    ? `${documentCount} document${documentCount === 1 ? "" : "s"} · ${result.sources.length} passages`
    : undefined;
  return (
    <aside className="hidden min-h-0 flex-col gap-3 overflow-y-auto bg-[#f7f9fc] p-3 xl:flex">
      <Panel title="Top Sources" subtitle={evidenceSummary}>
        {result?.sources.length ? <div className="space-y-2">{result.sources.map((source, index) => (
          <button key={`${source.document_title}-${source.page}-${index}`} type="button" onClick={() => onSelectSource(index)} className={`w-full rounded-lg border p-3 text-left transition ${selectedSource === index ? "border-blue-200 bg-blue-50 shadow-sm" : "border-slate-100 bg-slate-50 hover:border-slate-200"}`}>
            <div className="flex items-start gap-2.5"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm"><FileText size={14} /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-700">{source.document_title}</p><p className="mt-1 text-[10px] text-slate-400">Page {source.page} · Passage {index + 1} · Rev. {source.revision}</p></div><span className="text-[10px] font-medium text-blue-600">{source.score.toFixed(2)}</span></div>
          </button>
        ))}</div> : <EmptyPanel icon={<Search size={18} />} text="Ask a question to retrieve relevant sources." />}
      </Panel>

      <Panel title="Document Preview" action={activeSource ? <FileText size={13} /> : undefined} grow>
        {activeSource ? (
          <div className="flex h-full min-h-[210px] flex-col overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
              <div className="min-w-0"><p className="truncate text-[10px] font-medium text-slate-700">{activeSource.document_title}</p><p className="mt-0.5 text-[9px] text-slate-400">Page {activeSource.page} · Rev. {activeSource.revision}</p></div>
              <span className="ml-2 shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-600">{(activeSource.semantic_similarity ?? activeSource.score).toFixed(1)} relevance</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-white p-3 text-[10px] leading-[1.65] text-slate-600">
              {activeSource.content ? <HighlightedText text={activeSource.content} query={query} answer={result?.answer ?? ""} /> : <p className="text-center text-slate-400">Restart the updated backend to display retrieved document text.</p>}
            </div>
          </div>
        ) : <EmptyPanel icon={<FileText size={18} />} text="Select a source to preview its document text." />}
      </Panel>

      <Panel title="Document Info">
        {activeSource ? <dl className="grid grid-cols-[92px_1fr] gap-x-3 gap-y-2.5 text-[11px]"><dt className="text-slate-400">Document</dt><dd className="truncate font-medium text-slate-700">{activeSource.document_title}</dd><dt className="text-slate-400">Revision</dt><dd className="font-medium text-slate-700">{activeSource.revision}</dd><dt className="text-slate-400">Status</dt><dd><span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">{activeSource.status}</span></dd><dt className="text-slate-400">Page</dt><dd className="font-medium text-slate-700">{activeSource.page}</dd><dt className="text-slate-400">Similarity</dt><dd className="font-medium text-slate-700">{(activeSource.semantic_similarity ?? activeSource.score).toFixed(3)}</dd>{activeSource.chunk_id && <><dt className="text-slate-400">Chunk ID</dt><dd className="font-medium text-slate-700">{activeSource.chunk_id}</dd></>}</dl> : <EmptyPanel icon={<Info size={18} />} text="No document selected." compact />}
      </Panel>
    </aside>
  );
}

function Panel({ title, subtitle, action, grow, children }: { title: string; subtitle?: string; action?: React.ReactNode; grow?: boolean; children: React.ReactNode }) {
  return <section className={`flex flex-col rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03)] ${grow ? "min-h-[250px] flex-1" : "shrink-0"}`}><header className="flex h-11 shrink-0 items-center justify-between border-b border-slate-100 px-4"><div className="flex items-center gap-2"><h3 className="text-xs font-semibold">{title}</h3>{subtitle && <span className="text-[9px] text-slate-400">{subtitle}</span>}</div><span className="text-slate-400">{action}</span></header><div className={`p-3 ${grow ? "min-h-0 flex-1" : ""}`}>{children}</div></section>;
}

function EmptyPanel({ icon, text, compact }: { icon: React.ReactNode; text: string; compact?: boolean }) {
  return <div className={`flex flex-col items-center justify-center text-center text-slate-300 ${compact ? "min-h-16" : "min-h-24"}`}><span>{icon}</span><p className="mt-2 max-w-[230px] text-[10px] leading-4">{text}</p></div>;
}

function DocumentLibrary({ documents, loading, onClose, onUpload }: { documents: IndexedDocument[]; loading: boolean; onClose: () => void; onUpload: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <section className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div><h2 className="text-base font-semibold">Indexed Documents</h2><p className="mt-0.5 text-xs text-slate-400">Files currently available to the local RAG system</p></div>
          <div className="flex items-center gap-2"><button type="button" onClick={onUpload} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700"><UploadCloud size={14} /> Add document</button><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={17} /></button></div>
        </header>
        <div className="max-h-[65vh] overflow-y-auto p-5">
          {loading ? <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-400"><Loader2 className="animate-spin" size={17} /> Loading indexed documents...</div>
            : documents.length ? <div className="space-y-3">{documents.map((document) => (
              <article key={document.id} className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:shadow-sm">
                <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><FileText size={18} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-slate-800">{document.title}</h3><p className="mt-0.5 truncate text-xs text-slate-400">{document.filename}</p></div><span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-700">{document.status}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 sm:grid-cols-5"><DocumentStat label="Revision" value={document.revision} /><DocumentStat label="Pages" value={String(document.page_count)} /><DocumentStat label="Chunks" value={String(document.chunk_count)} /><DocumentStat label="Effective" value={document.effective_date || "Not set"} /><DocumentStat label="Indexed" value={formatIndexedDate(document.created_at)} /></div></div></div>
              </article>
            ))}</div>
            : <div className="flex min-h-48 flex-col items-center justify-center text-center"><Files size={24} className="text-slate-300" /><h3 className="mt-3 text-sm font-medium text-slate-700">No indexed documents</h3><p className="mt-1 text-xs text-slate-400">Upload a PDF, DOCX, or TXT file to begin.</p></div>}
        </div>
        <footer className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-[10px] text-slate-400">One uploaded file may produce multiple retrieval passages because documents are divided into searchable chunks.</footer>
      </section>
    </div>
  );
}

function DocumentStat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[9px] uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 truncate font-medium text-slate-700">{value}</p></div>;
}

function formatIndexedDate(value: string) {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function HighlightedText({ text, query, answer }: { text: string; query: string; answer: string }) {
  const stopWords = new Set(["what", "which", "when", "where", "does", "should", "about", "from", "that", "this", "with", "have", "into", "your", "document"]);
  const queryTerms = (query.match(/[A-Za-z0-9]+(?:\.[0-9]+)?/g) ?? [])
    .filter((term) => term.length >= 3 && !stopWords.has(term.toLowerCase()));
  const answerValues = answer.match(/\b\d+(?:\.\d+)?(?:\s?(?:bar|c|n\s?m|seconds?))?\b/gi) ?? [];
  const terms = [...new Set([...queryTerms, ...answerValues])]
    .sort((left, right) => right.length - left.length)
    .slice(0, 16);
  if (!terms.length) return <>{text}</>;

  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const matcher = new RegExp(`(${escaped.join("|")})`, "gi");
  const normalizedTerms = new Set(terms.map((term) => term.toLowerCase()));

  return <>{text.split(matcher).map((part, index) => normalizedTerms.has(part.toLowerCase())
    ? <mark key={`${part}-${index}`} className="rounded-sm bg-yellow-200 px-0.5 text-slate-800">{part}</mark>
    : <span key={`${part}-${index}`}>{part}</span>)}</>;
}
