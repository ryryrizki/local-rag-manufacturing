import Link from "next/link";
import { ArrowRight, Bot, FileSearch, FileText, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d2c50] font-bold text-white">HD</div>
          <div><div className="font-semibold">Precision AI Copilot</div><div className="text-xs text-slate-400">Manufacturing Knowledge Assistant</div></div>
        </div>
        <Link href="/chat" className="text-sm font-medium text-slate-600 hover:text-blue-600">Open Copilot</Link>
      </header>
      <section className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-16 px-8 md:grid-cols-2">
        <div>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">Find the right<br />information.<br /><span className="text-blue-600">Faster.</span></h1>
          <p className="mt-7 max-w-xl text-xl leading-8 text-slate-500">Search technical documents, ask manufacturing questions, and receive answers grounded in approved internal knowledge.</p>
          <Link href="/chat" className="mt-10 inline-flex items-center gap-3 rounded-xl bg-blue-600 px-6 py-3.5 font-medium text-white hover:bg-blue-700">Start AI Copilot <ArrowRight size={18} /></Link>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-7">
            <div className="flex items-center gap-3"><div className="rounded-full bg-blue-50 p-3 text-blue-600"><Bot size={21} /></div><div><div className="font-semibold">AI Copilot</div><div className="text-xs text-green-600">Ready</div></div></div>
            <div className="mt-7 rounded-xl bg-blue-50 p-5"><div className="text-sm font-medium text-blue-600">You</div><p className="mt-2">What is the tightening torque for M12 bolts?</p></div>
            <div className="mt-4 rounded-xl bg-slate-50 p-5"><div className="text-sm font-semibold">AI Copilot</div><p className="mt-2 leading-6 text-slate-600">According to the active work standard, the tightening torque is <strong className="text-slate-900">80 N·m.</strong></p><div className="mt-4 border-t pt-4 text-xs text-slate-400">Work Standard · Rev. 2.1 · p.12</div></div>
          </div>
        </div>
      </section>
      <section className="border-t bg-slate-50/50"><div className="mx-auto grid max-w-7xl gap-8 px-8 py-12 md:grid-cols-3">
        <Feature icon={<FileSearch size={22}/>} title="Search" text="Find information across manufacturing documents." />
        <Feature icon={<FileText size={22}/>} title="Verify" text="Review the source, page, revision, and status." />
        <Feature icon={<ShieldCheck size={22}/>} title="Ground" text="Answer only from retrieved internal knowledge." />
      </div></section>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{icon}</div><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></div>;
}

