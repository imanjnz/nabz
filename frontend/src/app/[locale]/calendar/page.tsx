"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

type StudySession = {
id: string;
duration: number;
date: string;
subjectId?: string;
};

type Subject = {
id: string;
name: string;
targetHours: number;
createdAt: string;
};

const WEEKDAYS = {
fa: ["ش", "ی", "د", "س", "چ", "پ", "ج"],
en: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
};

export default function CalendarPage() {
const locale = useLocale();
const isFa = locale === "fa";

const [sessions, setSessions] = useState<StudySession[]>([]);
const [subjects, setSubjects] = useState<Subject[]>([]);
const [currentDate, setCurrentDate] = useState(new Date());
const [selectedDate, setSelectedDate] = useState(
new Date().toLocaleDateString("en-CA")
);
const [loaded, setLoaded] = useState(false);

useEffect(() => {
try {
const savedSessions = localStorage.getItem("nabz-study-sessions");
const savedSubjects = localStorage.getItem("nabz-subjects");

if (savedSessions) {
setSessions(JSON.parse(savedSessions));
}

if (savedSubjects) {
setSubjects(JSON.parse(savedSubjects));
}
} catch {
setSessions([]);
setSubjects([]);
}

setLoaded(true);
}, []);

const year = currentDate.getFullYear();
const month = currentDate.getMonth();

const monthNames = isFa
? [
"ژانویه",
"فوریه",
"مارس",
"آوریل",
"مه",
"ژوئن",
"ژوئیه",
"اوت",
"سپتامبر",
"اکتبر",
"نوامبر",
"دسامبر",
]
: [
"January",
"February",
"March",
"April",
"May",
"June",
"July",
"August",
"September",
"October",
"November",
"December",
];

const dateKey = (date: Date) => {
const y = date.getFullYear();
const m = String(date.getMonth() + 1).padStart(2, "0");
const d = String(date.getDate()).padStart(2, "0");
return `${y}-${m}-${d}`;
};

const calendarDays = useMemo(() => {
const firstDay = new Date(year, month, 1);
const lastDay = new Date(year, month + 1, 0);

const startingDay = (firstDay.getDay() + 6) % 7;
const totalDays = lastDay.getDate();

return [
...Array(startingDay).fill(null),
...Array.from({ length: totalDays }, (_, index) => index + 1),
];
}, [year, month]);

const sessionsByDate = useMemo(() => {
const result: Record<string, StudySession[]> = {};

sessions.forEach((session) => {
const key = session.date.slice(0, 10);

if (!result[key]) {
result[key] = [];
}

result[key].push(session);
});

return result;
}, [sessions]);

const selectedSessions = sessionsByDate[selectedDate] || [];

const selectedDuration = selectedSessions.reduce(
(total, session) => total + session.duration,
0
);

const formatDuration = (seconds: number) => {
const hours = Math.floor(seconds / 3600);
const minutes = Math.floor((seconds % 3600) / 60);

if (hours > 0) {
return isFa
? `${hours} ساعت و ${minutes} دقیقه`
: `${hours}h ${minutes}m`;
}

return isFa ? `${minutes} دقیقه` : `${minutes}m`;
};

const changeMonth = (amount: number) => {
setCurrentDate(new Date(year, month + amount, 1));
};

const goToToday = () => {
const today = new Date();
setCurrentDate(today);
setSelectedDate(dateKey(today));
};

const todayKey = dateKey(new Date());

const monthlySessions = sessions.filter((session) => {
const sessionDate = new Date(session.date);

return (
sessionDate.getFullYear() === year &&
sessionDate.getMonth() === month
);
});

const monthlyDuration = monthlySessions.reduce(
(total, session) => total + session.duration,
0
);

const activeDays = Object.keys(sessionsByDate).filter((key) => {
return (
key.startsWith(
`${year}-${String(month + 1).padStart(2, "0")}`
) && sessionsByDate[key].length > 0
);
}).length;

const getSubjectName = (subjectId?: string) => {
if (!subjectId) {
return isFa ? "بدون درس" : "No subject";
}

const subject = subjects.find((item) => item.id === subjectId);

return subject
? subject.name
: isFa
? "درس حذف‌شده"
: "Deleted subject";
};

if (!loaded) {
return (
<main className="min-h-screen bg-[#080d1a] p-10 text-white">
<p>{isFa ? "در حال بارگذاری تقویم..." : "Loading calendar..."}</p>
</main>
);
}

return (
<main
dir={isFa ? "rtl" : "ltr"}
className="min-h-screen bg-[#080d1a] px-5 py-8 text-white md:px-10"
>
<div className="mx-auto max-w-6xl">
{/* Header */}
<header className="mb-8 flex flex-wrap items-center justify-between gap-4">
<div>
<Link
  href={`/${locale}/dashboard`}
  className="mb-3 inline-block text-sm text-cyan-400 hover:text-cyan-300"
>
  ← {isFa ? "بازگشت به داشبورد" : "Back to Dashboard"}
</Link>
<h1 className="text-3xl font-bold">
{isFa ? "تقویم مطالعاتی" : "Study Calendar"}
</h1>

<p className="mt-2 text-sm text-gray-400">
{isFa
? "مسیر یادگیری و استمرار مطالعه‌ات را دنبال کن."
: "Track your learning journey and study consistency."}
</p>
</div>

<Link
href={`/${locale}/study`}
className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-semibold transition hover:brightness-110"
>
{isFa ? "شروع مطالعه ↗" : "Start Studying ↗"}
</Link>
</header>

{/* Monthly Statistics */}
<section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
<div className="rounded-2xl border border-white/10 bg-[#101a2c] p-5">
<p className="text-sm text-gray-400">
{isFa ? "جلسات این ماه" : "Monthly Sessions"}
</p>
<h2 className="mt-3 text-3xl font-bold">
{monthlySessions.length}
</h2>
</div>

<div className="rounded-2xl border border-white/10 bg-[#101a2c] p-5">
<p className="text-sm text-gray-400">
{isFa ? "زمان مطالعه این ماه" : "Monthly Study Time"}
</p>
<h2 className="mt-3 text-2xl font-bold">
{formatDuration(monthlyDuration)}
</h2>
</div>

<div className="rounded-2xl border border-white/10 bg-[#101a2c] p-5">
<p className="text-sm text-gray-400">
{isFa ? "روزهای مطالعه" : "Active Days"}
</p>
<h2 className="mt-3 text-3xl font-bold">
{activeDays}
</h2>
</div>
</section>

{/* Calendar */}
<section className="rounded-3xl border border-white/10 bg-[#101a2c] p-5 md:p-7">
<div className="mb-7 flex flex-wrap items-center justify-between gap-4">
<div>
<h2 className="text-xl font-bold">
{monthNames[month]} {year}
</h2>
<p className="mt-1 text-xs text-gray-500">
{isFa ? "تقویم جلسات مطالعه" : "Study session calendar"}
</p>
</div>

<div className="flex items-center gap-2">
<button
onClick={goToToday}
className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
>
{isFa ? "امروز" : "Today"}
</button>

<button
onClick={() => changeMonth(-1)}
className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
aria-label="Previous month"
>
→
</button>

<button
onClick={() => changeMonth(1)}
className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
aria-label="Next month"
>
←
</button>
</div>
</div>

<div className="grid grid-cols-7 gap-2">
{WEEKDAYS[isFa ? "fa" : "en"].map((day, index) => (
<div
key={index}
className="py-3 text-center text-xs font-semibold text-gray-500"
>
{day}
</div>
))}

{calendarDays.map((day, index) => {
if (!day) {
return <div key={`empty-${index}`} />;
}

const date = new Date(year, month, day);
const key = dateKey(date);
const daySessions = sessionsByDate[key] || [];
const isToday = key === todayKey;
const isSelected = key === selectedDate;

return (
<button
key={key}
onClick={() => setSelectedDate(key)}
className={`relative flex min-h-16 flex-col items-center justify-center rounded-xl border p-2 transition sm:min-h-20 ${
isSelected
? "border-cyan-400 bg-cyan-400/10"
: isToday
? "border-violet-400/50 bg-violet-400/5"
: "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/5"
}`}
>
<span
className={`text-sm ${
isSelected
? "font-bold text-cyan-300"
: isToday
? "font-bold text-violet-300"
: "text-gray-300"
}`}
>
{day}
</span>

{daySessions.length > 0 && (
<div className="mt-2 flex items-center gap-1">
<span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
<span className="text-[9px] text-cyan-300">
{daySessions.length}
</span>
</div>
)}
</button>
);
})}
</div>

<div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-gray-500">
<div className="flex items-center gap-2">
<span className="h-2 w-2 rounded-full bg-cyan-400" />
{isFa ? "دارای جلسه مطالعه" : "Study session"}
</div>

<div className="flex items-center gap-2">
<span className="h-2 w-2 rounded-full bg-violet-400" />
{isFa ? "امروز" : "Today"}
</div>
</div>
</section>

{/* Selected Day */}
<section className="mt-6 rounded-3xl border border-white/10 bg-[#101a2c] p-6">
<div className="mb-5 flex items-center justify-between gap-3">
<div>
<h2 className="text-lg font-bold">
{isFa ? "جلسات این روز" : "Sessions on this day"}
</h2>
<p className="mt-1 text-xs text-gray-500">
{selectedDate}
</p>
</div>

<span className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-sm text-cyan-300">
{formatDuration(selectedDuration)}
</span>
</div>

{selectedSessions.length === 0 ? (
<div className="rounded-2xl border border-dashed border-white/10 py-10 text-center">
<div className="mb-3 text-3xl">◷</div>
<p className="text-sm text-gray-400">
{isFa
? "برای این روز جلسه‌ای ثبت نشده است."
: "No study sessions recorded for this day."}
</p>
</div>
) : (
<div className="space-y-3">
{selectedSessions.map((session) => (
<div
key={session.id}
className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
>
<div>
<h3 className="font-semibold">
{getSubjectName(session.subjectId)}
</h3>
<p className="mt-1 text-xs text-gray-500">
{new Date(session.date).toLocaleTimeString(
isFa ? "fa-IR" : "en-US",
{
hour: "2-digit",
minute: "2-digit",
}
)}
</p>
</div>

<span className="text-sm font-semibold text-cyan-300">
{formatDuration(session.duration)}
</span>
</div>
))}
</div>
)}
</section>
</div>
</main>
);
}

