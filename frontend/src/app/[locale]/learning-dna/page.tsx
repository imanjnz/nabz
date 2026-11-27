"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
type Profile = { observed_patterns?: string[]; effective_habits?: string[]; possible_gaps?: string[]; experiments_to_try?: string[] };

export default function LearningDNA() {
  const locale = useLocale();
  const isFa = locale === "fa";
  const [sessions,setSessions]=useState<any[]>([]);
  const [subjects,setSubjects]=useState<any[]>([]);
  const [profile,setProfile]=useState<Profile|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{try{const s=JSON.parse(localStorage.getItem("nabz-study-sessions")||"[]");const d=JSON.parse(localStorage.getItem("nabz-subjects")||"[]");setSessions(Array.isArray(s)?s:[]);setSubjects(Array.isArray(d)?d:[]);}catch{setSessions([]);setSubjects([]);}},[]);
  const analyze=async()=>{
    setLoading(true);setError("");
    try{
      const response=await fetch(`${API}/api/ai/learning-profile`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessions:sessions.slice(-500),subjects:subjects.slice(0,100),exam_results:[]})});
      const data=await response.json();if(!response.ok)throw new Error(data.detail||"Profile analysis failed.");setProfile(data);
    }catch(e){setError(e instanceof Error?e.message:(isFa?"خطا در تحلیل":"Analysis failed"));}
    finally{setLoading(false);}
  };
  const sections:[keyof Profile,string,string][]=[
    ["observed_patterns","🔎",isFa?"الگوهای مشاهده‌شده":"Observed patterns"],
    ["effective_habits","🌱",isFa?"عادت‌های مؤثر":"Effective habits"],
    ["possible_gaps","🧭",isFa?"زمینه‌های قابل بررسی":"Possible gaps"],
    ["experiments_to_try","✨",isFa?"پیشنهادهایی برای امتحان":"Experiments to try"]
  ];
  return <main dir={isFa?"rtl":"ltr"} className="min-h-screen bg-[#080d1c] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-5xl"><Link href={`/${locale}/dashboard`} className="text-sm text-cyan-400">← {isFa?"داشبورد":"Dashboard"}</Link><header className="my-8"><p className="text-sm tracking-widest text-violet-300">NABZ / LEARNING DNA</p><h1 className="mt-2 text-3xl font-bold">{isFa?"DNA یادگیری من":"My Learning DNA"}</h1><p className="mt-3 text-slate-400">{isFa?"با بررسی جلسات ثبت‌شده، الگوهای مطالعه‌ات را پیدا کن؛ این گزارش تشخیص قطعی یا برچسب شخصیتی نیست.":"Explore patterns in your study history. This is a reflective summary, not a diagnosis or fixed label."}</p></header><div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-slate-300">{isFa?"داده‌های در دسترس":"Available data"}</p><p className="mt-2 text-2xl font-bold">{sessions.length} <span className="text-sm font-normal text-slate-400">{isFa?"جلسه مطالعه":"study sessions"}</span></p><p className="mt-1 text-sm text-slate-400">{subjects.length} {isFa?"درس":"subjects"}</p></div><button onClick={analyze} disabled={loading||sessions.length===0} className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-bold disabled:opacity-40">{loading?(isFa?"در حال تحلیل...":"Analyzing..."):(isFa?"تحلیل DNA یادگیری":"Analyze my learning DNA")}</button></div></div>{error&&<p className="mt-4 rounded-xl bg-red-500/10 p-3 text-red-200">{error}</p>}{profile&&<div className="mt-6 grid gap-4 md:grid-cols-2">{sections.map(([key,emoji,title])=><section key={key} className="rounded-2xl border border-white/10 bg-[#111a30] p-5"><h2 className="mb-4 text-lg font-bold">{emoji} {title}</h2>{Array.isArray(profile[key])&&profile[key]!.length?<ul className="list-inside list-disc space-y-3 text-sm leading-7 text-slate-300">{(profile[key] as string[]).map((item,i)=><li key={i}>{item}</li>)}</ul>:<p className="text-sm text-slate-500">{isFa?"داده کافی برای این بخش وجود ندارد.":"Not enough evidence for this section yet."}</p>}</section>)}</div>}<p className="mt-6 text-xs leading-6 text-slate-500">{isFa?"هرچه جلسات بیشتری ثبت کنی، تحلیل می‌تواند دقیق‌تر شود. داده‌های مطالعه از حافظه محلی مرورگر ارسال می‌شوند.":"More recorded sessions can improve the analysis. Study data is sent from this browser's local storage."}</p></div></main>;
}
