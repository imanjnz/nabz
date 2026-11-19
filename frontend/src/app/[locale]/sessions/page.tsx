"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";

type Subject = {
id: string;
name: string;
targetHours: number;
createdAt: string;
};

type StudySession = {
id: string;
duration: number;
date: string;
subjectId?: string;
};

const SESSIONS_KEY = "nabz-study-sessions";
const SUBJECTS_KEY = "nabz-subjects";

export default function SessionsPage() {
const locale = useLocale();
const isFa = locale === "fa";

const [sessions, setSessions] = useState<StudySession[]>([]);
const [subjects, setSubjects] = useState<Subject[]>([]);
const [selectedSubject, setSelectedSubject] = useState("all");
const [selectedDate, setSelectedDate] = useState("all");
const [loaded, setLoaded] = useState(false);

// Load saved data
useEffect(() => {
try {
const savedSessions = localStorage.getItem(SESSIONS_KEY);
const savedSubjects = localStorage.getItem(SUBJECTS_KEY);

if (savedSessions) {
const parsed = JSON.parse(savedSessions);
if (Array.isArray(parsed)) {
setSessions(parsed);
}
}

if (savedSubjects) {
const parsed = JSON.parse(savedSubjects);
if (Array.isArray(parsed)) {
setSubjects(parsed);
}
}
} catch {
console.error("Could not load session data.");
}

setLoaded(true);
}, []);

// Save sessions
useEffect(() => {
if (!loaded) return;

try {
localStorage.setItem(
SESSIONS_KEY,
JSON.stringify(sessions)
);
} catch {
console.error("Could not save sessions.");
}
}, [sessions, loaded]);

// Format duration
const formatTime = (totalSeconds: number) => {
const hours = Math.floor(totalSeconds / 3600);
const minutes = Math.floor((totalSeconds % 3600) / 60);
const seconds = totalSeconds % 60;

if (hours > 0) {
return `${hours}${isFa ? " ساعت " : "h "}${minutes}${isFa ? " دقیقه" : "m"}`;
}

if (minutes > 0) {
return `${minutes}${isFa ? " دقیقه" : "m"}`;
}

return `${seconds}${isFa ? " ثانیه" : "s"}`;
};

// Get subject name
const getSubjectName = (subjectId?: string) => {
if (!subjectId) {
return isFa ? "بدون درس" : "No subject";
}

return (
subjects.find((subject) => subject.id === subjectId)?.name ||
(isFa ? "درس حذف‌شده" : "Deleted subject")
);
};

// Date key in local timezone
const getLocalDateKey = (value: string) => {
const date = new Date(value);

if (Number.isNaN(date.getTime())) return "";

const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;
};

// Filter sessions
const filteredSessions = useMemo(() => {
return sessions.filter((session) => {
const subjectMatch =
selectedSubject === "all" ||
(selectedSubject === "none"
? !session.subjectId
: session.subjectId === selectedSubject);

const dateMatch =
selectedDate === "all" ||
getLocalDateKey(session.date) === selectedDate;

return subjectMatch && dateMatch;
});
}, [sessions, selectedSubject, selectedDate]);

// Statistics
const totalSeconds = sessions.reduce(
(total, session) => total + session.duration,
0
);

const filteredSeconds = filteredSessions.reduce(
(total, session) => total + session.duration,
0
);

// Delete session
const deleteSession = (id: string) => {
const confirmed = window.confirm(
isFa
? "آیا از حذف این جلسه مطمئنی؟"
: "Are you sure you want to delete this session?"
);

if (!confirmed) return;

setSessions((previous) =>
previous.filter((session) => session.id !== id)
);
};

// Date formatting
const formatDate = (value: string) => {
const date = new Date(value);

if (Number.isNaN(date.getTime())) {
return isFa ? "تاریخ نامعتبر" : "Invalid date";
}

return date.toLocaleString(
isFa ? "fa-IR" : "en-US",
{
year: "numeric",
month: "long",
day: "numeric",
hour: "2-digit",
minute: "2-digit",
}
);
};

if (!loaded) {
return (
<main className="flex min-h-screen items-center justify-center bg-[#080d1c] text-white">
{isFa ? "در حال بارگذاری..." : "Loading..."}
</main>
);
}

return (
<main
dir={isFa ? "rtl" : "ltr"}
className="min-h-screen bg-[#080d1c] px-4 py-8 text-white sm:px-8"
>
<div className="mx-auto max-w-6xl">

{/* Header */}
<header className="mb-10 flex flex-wrap items-center justify-between gap-4">
<div>
<p className="mb-2 text-sm font-medium text-cyan-400">
NABZ / STUDY SESSIONS
</p>

<h1 className="text-3xl font-bold sm:text-4xl">
{isFa ? "جلسات مطالعه" : "Study Sessions"}
</h1>

<p className="mt-2 text-sm text-slate-400">
{isFa
? "تمام جلسات مطالعه‌ات رو مدیریت و بررسی کن."
: "Manage and review all your study sessions."}
</p>
</div>

<Link
  href={`/${locale}/dashboard`}
  className="mb-3 inline-block text-sm text-cyan-400 hover:text-cyan-300"
>
  ← {isFa ? "بازگشت به داشبورد" : "Back to Dashboard"}
</Link>
</header>

{/* Statistics */}
<section className="mb-8 grid gap-4 sm:grid-cols-2">
<div className="rounded-2xl border border-violet-400/20 bg-[#111a30] p-6">
<p className="text-sm text-slate-400">
{isFa ? "کل جلسات ثبت‌شده" : "Total Sessions"}
</p>

<h2 className="mt-4 text-3xl font-bold text-violet-300">
{sessions.length}
</h2>
</div>

<div className="rounded-2xl border border-cyan-400/20 bg-[#111a30] p-6">
<p className="text-sm text-slate-400">
{isFa ? "مجموع زمان مطالعه" : "Total Study Time"}
</p>

<h2 className="mt-4 text-3xl font-bold text-cyan-300">
{formatTime(totalSeconds)}
</h2>
</div>
</section>

{/* Filters */}
<section className="mb-8 rounded-2xl border border-white/10 bg-[#111a30] p-6">
<h2 className="mb-5 text-lg font-bold">
{isFa ? "فیلتر جلسات" : "Filter Sessions"}
</h2>

<div className="grid gap-4 sm:grid-cols-2">

<div>
<label className="mb-2 block text-sm text-slate-400">
{isFa ? "انتخاب درس" : "Select Subject"}
</label>

<select
value={selectedSubject}
onChange={(event) =>
setSelectedSubject(event.target.value)
}
className="w-full rounded-xl border border-white/10 bg-[#080d1c] px-4 py-3 text-white outline-none focus:border-violet-400"
>
<option value="all">
{isFa ? "همه درس‌ها" : "All Subjects"}
</option>

<option value="none">
{isFa ? "جلسات بدون درس" : "Sessions without subject"}
</option>

{subjects.map((subject) => (
<option key={subject.id} value={subject.id}>
{subject.name}
</option>
))}
</select>
</div>

<div>
<label className="mb-2 block text-sm text-slate-400">
{isFa ? "انتخاب تاریخ" : "Select Date"}
</label>

<select
value={selectedDate}
onChange={(event) =>
setSelectedDate(event.target.value)
}
className="w-full rounded-xl border border-white/10 bg-[#080d1c] px-4 py-3 text-white outline-none focus:border-violet-400"
>
<option value="all">
{isFa ? "همه تاریخ‌ها" : "All Dates"}
</option>

{Array.from(
new Set(
sessions
.map((session) =>
getLocalDateKey(session.date)
)
.filter(Boolean)
)
)
.sort((a, b) => b.localeCompare(a))
.map((date) => (
<option key={date} value={date}>
{new Date(
`${date}T12:00:00`
).toLocaleDateString(
isFa ? "fa-IR" : "en-US"
)}
</option>
))}
</select>
</div>
</div>

<div className="mt-5 flex flex-wrap items-center justify-between gap-3">
<p className="text-sm text-slate-400">
{isFa ? "تعداد نتایج:" : "Results:"}{" "}
<span className="font-bold text-cyan-300">
{filteredSessions.length}
</span>
</p>

<button
type="button"
onClick={() => {
setSelectedSubject("all");
setSelectedDate("all");
}}
className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
>
{isFa ? "پاک کردن فیلترها" : "Clear Filters"}
</button>
</div>
</section>

{/* Filtered Summary */}
<section className="mb-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
<p className="text-sm text-slate-400">
{isFa
? "مجموع زمان جلسات فیلترشده"
: "Filtered Study Duration"}
</p>

<h2 className="mt-2 text-2xl font-bold text-cyan-300">
{formatTime(filteredSeconds)}
</h2>
</section>

{/* Session List */}
<section>
<div className="mb-5 flex items-center justify-between">
<h2 className="text-xl font-bold">
{isFa ? "تاریخچه جلسات" : "Session History"}
</h2>

<span className="text-sm text-slate-400">
{filteredSessions.length}{" "}
{isFa ? "جلسه" : "sessions"}
</span>
</div>

{filteredSessions.length === 0 ? (
<div className="rounded-3xl border border-dashed border-white/15 bg-[#111a30] p-12 text-center">
<div className="mb-4 text-5xl">📚</div>

<h3 className="font-semibold text-slate-300">
{sessions.length === 0
? isFa
? "هنوز جلسه‌ای ثبت نکردی."
: "No sessions recorded yet."
: isFa
? "جلسه‌ای با این فیلتر پیدا نشد."
: "No sessions match these filters."}
</h3>

<p className="mt-2 text-sm text-slate-500">
{sessions.length === 0
? isFa
? "اولین جلسه مطالعه‌ات رو شروع کن."
: "Start your first study session."
: isFa
? "فیلترها رو تغییر بده و دوباره امتحان کن."
: "Change your filters and try again."}
</p>

{sessions.length === 0 && (
<Link
href={`/${locale}/study`}
className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-bold"
>
{isFa ? "شروع مطالعه" : "Start Studying"}
</Link>
)}
</div>
) : (
<div className="space-y-3">
{filteredSessions.map((session) => (
<article
key={session.id}
className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#111a30] p-5 transition hover:border-violet-400/30"
>
<div className="flex min-w-0 items-center gap-4">
<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-xl text-violet-300">
◷
</div>

<div className="min-w-0">
<h3 className="truncate font-semibold text-white">
{getSubjectName(session.subjectId)}
</h3>

<p className="mt-1 text-xs text-slate-500">
{formatDate(session.date)}
</p>
</div>
</div>

<div className="flex items-center gap-4">
<span className="font-mono font-bold text-cyan-300">
{formatTime(session.duration)}
</span>

<button
type="button"
onClick={() => deleteSession(session.id)}
className="rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-400/10"
>
{isFa ? "حذف" : "Delete"}
</button>
</div>
</article>
))}
</div>
)}
</section>

{/* Footer */}
<footer className="mt-16 border-t border-white/10 py-6 text-center text-xs tracking-wider text-slate-500">
NABZ © 2026 — THE PULSE OF LEARNING
</footer>

</div>
</main>
);
}

