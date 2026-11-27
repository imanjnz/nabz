"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
type Message = { role: "user" | "assistant"; text: string };

export default function TutorPage() {
  const locale = useLocale();
  const isFa = locale === "fa";
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("");
  const [context, setContext] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);

  const ask = async (spokenText?: string) => {
    const prompt = (spokenText ?? question).trim();
    if (!prompt || loading) return;
    setMessages((old) => [...old, { role: "user", text: prompt }]);
    setQuestion("");
    setLoading(true);
    setError("");
    try {
      const voiceMode = Boolean(spokenText);\n      const conversation_context = messages.slice(-8).map((item) => `${item.role}: ${item.text}`).join("\\n");\n      const response = await fetch(`${API}/api/ai/${voiceMode ? "voice-tutor" : "tutor"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voiceMode ? { text: prompt, conversation_context } : { question: prompt, subject, context }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Tutor request failed.");
      setMessages((old) => [...old, { role: "assistant", text: data.answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : (isFa ? "خطا در ارتباط با هوش مصنوعی" : "AI connection failed"));
    } finally { setLoading(false); }
  };

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isFa ? "fa-IR" : "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const startVoice = () => {
    const w = window as Window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Recognition) {
      setError(isFa ? "تشخیص گفتار در این مرورگر پشتیبانی نمی‌شود؛ می‌توانی سؤال را تایپ کنی." : "Speech recognition is not supported in this browser. You can type instead.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = isFa ? "fa-IR" : "en-US";
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) void ask(transcript);
    };
    recognition.onerror = () => setError(isFa ? "دریافت صدا ناموفق بود." : "Could not capture speech.");
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  return <main dir={isFa ? "rtl" : "ltr"} className="min-h-screen bg-[#080d1c] px-4 py-8 text-white sm:px-8">
    <div className="mx-auto max-w-4xl">
      <Link href={`/${locale}/dashboard`} className="text-sm text-cyan-400">← {isFa ? "داشبورد" : "Dashboard"}</Link>
      <header className="my-8"><p className="text-sm tracking-widest text-cyan-300">NABZ AI TUTOR</p><h1 className="mt-2 text-3xl font-bold">{isFa ? "معلم هوشمند نبض" : "NABZ AI Tutor"}</h1><p className="mt-3 text-slate-400">{isFa ? "سؤال بپرس، مفهوم‌ها را مرحله‌به‌مرحله یاد بگیر و در صورت تمایل با صدا گفتگو کن." : "Ask questions, learn step by step, and optionally use voice input and spoken replies."}</p></header>
      <section className="mb-5 grid gap-3 rounded-2xl border border-white/10 bg-[#111a30] p-5 sm:grid-cols-2">
        <label className="text-sm text-slate-300">{isFa ? "موضوع یا درس" : "Subject"}<input value={subject} onChange={e=>setSubject(e.target.value)} placeholder={isFa ? "مثلاً ساختمان داده" : "e.g. Data structures"} className="mt-2 w-full rounded-xl border border-white/10 bg-[#080d1c] p-3 text-white" /></label>
        <label className="text-sm text-slate-300">{isFa ? "متن یا جزوه مرتبط (اختیاری)" : "Relevant notes (optional)"}<input value={context} onChange={e=>setContext(e.target.value)} placeholder={isFa ? "متن کوتاه برای زمینه پاسخ" : "Short context for the answer"} className="mt-2 w-full rounded-xl border border-white/10 bg-[#080d1c] p-3 text-white" /></label>
      </section>
      <section className="min-h-[300px] space-y-4 rounded-2xl border border-white/10 bg-[#111a30] p-5">
        {messages.length === 0 && <p className="py-16 text-center text-slate-500">{isFa ? "گفتگو را با نوشتن اولین سؤال شروع کن." : "Start by asking your first question."}</p>}
        {messages.map((m,i)=><article key={i} className={`max-w-[90%] rounded-2xl p-4 leading-8 ${m.role==="user"?"ms-auto bg-violet-500/15":"me-auto bg-cyan-500/10"}`}><p className="mb-1 text-xs text-slate-400">{m.role==="user"?(isFa?"شما":"You"):"NABZ AI"}</p><p className="whitespace-pre-wrap">{m.text}</p>{m.role==="assistant"&&<button onClick={()=>speak(m.text)} className="mt-3 text-xs text-cyan-300">🔊 {isFa?"خواندن پاسخ":"Read aloud"}</button>}</article>)}
        {loading && <p className="text-sm text-cyan-300">{isFa ? "نبض در حال فکر کردن..." : "NABZ is thinking..."}</p>}
      </section>
      {error && <p className="my-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <form onSubmit={e=>{e.preventDefault();void ask();}} className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111a30] p-4">
        <textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={3} placeholder={isFa?"سؤالت را اینجا بنویس...":"Type your question..."} className="w-full resize-y rounded-xl border border-white/10 bg-[#080d1c] p-4 text-white outline-none focus:border-cyan-400" />
        <div className="flex flex-wrap gap-3"><button disabled={loading||!question.trim()} className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-bold disabled:opacity-40">{loading?(isFa?"در حال ارسال...":"Sending..."):(isFa?"ارسال سؤال":"Ask NABZ")}</button><button type="button" onClick={startVoice} className="rounded-xl border border-cyan-400/30 px-5 py-3 text-cyan-200">{listening?(isFa?"در حال شنیدن...":"Listening..."):(isFa?"🎙️ پرسش صوتی":"🎙️ Voice question")}</button></div>
      </form>
      <p className="mt-3 text-xs leading-6 text-slate-500">{isFa?"ورودی صوتی و خواندن پاسخ از قابلیت‌های مرورگر استفاده می‌کنند؛ برای آن‌ها به API جداگانه تبدیل گفتار نیاز نیست.":"Voice input and read-aloud use browser speech features; no separate speech API is required."}</p>
    </div>
  </main>;
}
