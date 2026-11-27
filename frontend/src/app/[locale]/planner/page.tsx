
"use client";

import { useEffect, useState } from "react";
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

type Plan = {
id: string;
title: string;
subjectId: string;
date: string;
duration: number;
completed: boolean;
createdAt: string;
};

type Availability = Record<number, number>;

const SUBJECTS_KEY = "nabz-subjects";
const PLANS_KEY = "nabz-study-plans";
const SESSIONS_KEY = "nabz-study-sessions";
const AVAILABILITY_KEY = "nabz-weekly-availability";

const WEEK_DAYS = [
{ id: 6, fa: "شنبه", en: "Saturday" },
{ id: 0, fa: "یکشنبه", en: "Sunday" },
{ id: 1, fa: "دوشنبه", en: "Monday" },
{ id: 2, fa: "سه‌شنبه", en: "Tuesday" },
{ id: 3, fa: "چهارشنبه", en: "Wednesday" },
{ id: 4, fa: "پنجشنبه", en: "Thursday" },
{ id: 5, fa: "جمعه", en: "Friday" },
];

const DEFAULT_AVAILABILITY: Availability = {
0: 120,
1: 120,
2: 120,
3: 120,
4: 120,
5: 120,
6: 120,
};

function getLocalDate(date: Date) {
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;
}

function addDays(dateString: string, amount: number) {
const date = new Date(`${dateString}T12:00:00`);
date.setDate(date.getDate() + amount);
return getLocalDate(date);
}

export default function PlannerPage() {
const locale = useLocale();
const isFa = locale === "fa";

const [subjects, setSubjects] = useState<Subject[]>([]);
const [sessions, setSessions] = useState<StudySession[]>([]);
const [plans, setPlans] = useState<Plan[]>([]);

const [availability, setAvailability] =
useState<Availability>(DEFAULT_AVAILABILITY);

const [title, setTitle] = useState("");
const [subjectId, setSubjectId] = useState("");
const [date, setDate] = useState("");
const [duration, setDuration] = useState("60");

const [loaded, setLoaded] = useState(false);
const [message, setMessage] = useState("");

useEffect(() => {
try {
const savedSubjects = localStorage.getItem(SUBJECTS_KEY);
const savedSessions = localStorage.getItem(SESSIONS_KEY);
const savedPlans = localStorage.getItem(PLANS_KEY);
const savedAvailability =
localStorage.getItem(AVAILABILITY_KEY);

if (savedSubjects) {
const parsed = JSON.parse(savedSubjects);
if (Array.isArray(parsed)) setSubjects(parsed);
}

if (savedSessions) {
const parsed = JSON.parse(savedSessions);
if (Array.isArray(parsed)) setSessions(parsed);
}

if (savedPlans) {
const parsed = JSON.parse(savedPlans);
if (Array.isArray(parsed)) setPlans(parsed);
}

if (savedAvailability) {
const parsed = JSON.parse(savedAvailability);

if (parsed && typeof parsed === "object") {
setAvailability({
...DEFAULT_AVAILABILITY,
...parsed,
});
}
}
} catch {
console.error("Could not load planner data.");
}

setDate(getLocalDate(new Date()));
setLoaded(true);
}, []);

useEffect(() => {
if (!loaded) return;

localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}, [plans, loaded]);

useEffect(() => {
if (!loaded) return;

localStorage.setItem(
AVAILABILITY_KEY,
JSON.stringify(availability)
);
}, [availability, loaded]);

const today = getLocalDate(new Date());

// Detect overdue plans.
const overduePlans = plans.filter(
(plan) => !plan.completed && plan.date < today
);

const futurePendingPlans = plans.filter(
(plan) => !plan.completed && plan.date >= today
);

const addPlan = (event: React.FormEvent<HTMLFormElement>) => {
event.preventDefault();

const cleanTitle = title.trim();
const minutes = Number(duration);

if (
!cleanTitle ||
!subjectId ||
!date ||
!Number.isFinite(minutes) ||
minutes <= 0 ||
minutes > 1440
) {
return;
}

const newPlan: Plan = {
id: crypto.randomUUID(),
title: cleanTitle,
subjectId,
date,
duration: minutes,
completed: false,
createdAt: new Date().toISOString(),
};

setPlans((previous) =>
[...previous, newPlan].sort((a, b) =>
a.date.localeCompare(b.date)
)
);

setTitle("");
setDuration("60");
setMessage(
isFa ? "برنامه جدید ثبت شد." : "New plan created."
);
};

const togglePlan = (id: string) => {
setPlans((previous) =>
previous.map((plan) =>
plan.id === id
? { ...plan, completed: !plan.completed }
: plan
)
);
};

const deletePlan = (id: string) => {
setPlans((previous) =>
previous.filter((plan) => plan.id !== id)
);
};

const updateAvailability = (
dayId: number,
value: string
) => {
const minutes = Number(value);

if (
!Number.isFinite(minutes) ||
minutes < 0 ||
minutes > 1440
) {
return;
}

setAvailability((previous) => ({
...previous,
[dayId]: minutes,
}));
};

const getSubjectName = (id: string) => {
return (
subjects.find((subject) => subject.id === id)?.name ||
(isFa ? "درس حذف‌شده" : "Deleted subject")
);
};

const formatDate = (value: string) => {
const parts = value.split("-").map(Number);

if (parts.length !== 3 || parts.some((part) => !part)) {
return value;
}

const [year, month, day] = parts;
const parsedDate = new Date(year, month - 1, day);

return parsedDate.toLocaleDateString(
isFa ? "fa-IR" : "en-US",
{
year: "numeric",
month: "long",
day: "numeric",
}
);
};

const formatMinutes = (minutes: number) => {
const hours = Math.floor(minutes / 60);
const remaining = minutes % 60;

if (hours === 0) {
return `${remaining} ${isFa ? "دقیقه" : "min"}`;
}

return `${hours}h ${remaining}m`;
};

// AI-powered weekly plan generation.
const [aiPlanning, setAiPlanning] = useState(false);

const generateSmartPlan = async () => {
if (subjects.length === 0) {
setMessage(isFa ? "ابتدا حداقل یک درس اضافه کن." : "Add at least one subject first.");
return;
}
setAiPlanning(true);
setMessage("");
try {
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/ai/planner`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
subjects,
recent_sessions: sessions.slice(-120),
existing_plans: plans.filter((plan) => !plan.completed),
availability,
start_date: getLocalDate(new Date()),
days: 7,
preferences: isFa ? "پیشنهادها را به فارسی و واقع‌بینانه ارائه کن." : "Keep recommendations realistic."
}),
});
const data = await response.json();
if (!response.ok) throw new Error(data.detail || "AI planner request failed.");
const generated = Array.isArray(data.plans) ? data.plans : [];
const newPlans: Plan[] = generated.map((item: { title?: string; subjectId?: string; date?: string; duration?: number }) => ({
id: crypto.randomUUID(),
title: String(item.title || (isFa ? "مطالعه" : "Study session")),
subjectId: String(item.subjectId || ""),
date: String(item.date || ""),
duration: Number(item.duration || 0),
completed: false,
createdAt: new Date().toISOString(),
})).filter((plan: Plan) =>
subjects.some((subject) => subject.id === plan.subjectId) &&
/^\d{4}-\d{2}-\d{2}$/.test(plan.date) &&
plan.date >= getLocalDate(new Date()) &&
plan.date <= addDays(getLocalDate(new Date()), 6) &&
Number.isFinite(plan.duration) && plan.duration >= 15 && plan.duration <= 180
);
if (!newPlans.length) throw new Error(isFa ? "هوش مصنوعی برنامه معتبر تولید نکرد. دوباره تلاش کن." : "The AI did not return a valid plan. Try again.");
setPlans((previous) => [...previous, ...newPlans].sort((a, b) => a.date.localeCompare(b.date)));
const totalGenerated = newPlans.reduce((total, plan) => total + plan.duration, 0);
const overview = typeof data.overview === "string" ? data.overview : "";
setMessage(isFa
? `${newPlans.length} برنامه با مجموع ${formatMinutes(totalGenerated)} ساخته شد. ${overview}`
: `${newPlans.length} AI-generated tasks created (${formatMinutes(totalGenerated)}). ${overview}`);
} catch (error) {
setMessage(error instanceof Error ? error.message : (isFa ? "ارتباط با سرویس هوش مصنوعی برقرار نشد." : "Could not connect to the AI service."));
} finally {
setAiPlanning(false);
}
};

// Smart rescheduling of overdue plans.
const rescheduleOverduePlans = () => {
if (overduePlans.length === 0) {
setMessage(
isFa
? "هیچ برنامه عقب‌افتاده‌ای وجود ندارد."
: "There are no overdue plans."
);
return;
}

// Start from tomorrow and look ahead seven days.
const availableByDate: Record<string, number> = {};

for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
const targetDate = addDays(today, dayOffset);

const dayId = new Date(
`${targetDate}T12:00:00`
).getDay();

const dailyCapacity = availability[dayId] ?? 0;

const alreadyPlanned = plans
.filter(
(plan) =>
plan.date === targetDate &&
!plan.completed
)
.reduce(
(total, plan) => total + plan.duration,
0
);

availableByDate[targetDate] = Math.max(
0,
dailyCapacity - alreadyPlanned
);
}

const sortedOverdue = [...overduePlans].sort(
(a, b) =>
a.date.localeCompare(b.date) ||
a.createdAt.localeCompare(b.createdAt)
);

const updatedDates: Record<string, string> = {};
let movedCount = 0;

for (const plan of sortedOverdue) {
let destinationDate = "";

for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
const candidateDate = addDays(today, dayOffset);

if (
(availableByDate[candidateDate] ?? 0) >=
plan.duration
) {
destinationDate = candidateDate;
break;
}
}

if (destinationDate) {
updatedDates[plan.id] = destinationDate;

availableByDate[destinationDate] -= plan.duration;
movedCount++;
}
}

if (movedCount === 0) {
setMessage(
isFa
? "در هفت روز آینده ظرفیت کافی برای انتقال برنامه‌های عقب‌افتاده وجود ندارد. زمان آزاد روزها را بررسی کن."
: "There is not enough available capacity in the next seven days. Review your availability."
);
return;
}

setPlans((previous) =>
previous
.map((plan) =>
updatedDates[plan.id]
? { ...plan, date: updatedDates[plan.id] }
: plan
)
.sort((a, b) => a.date.localeCompare(b.date))
);

const remainingCount = overduePlans.length - movedCount;

setMessage(
isFa
? `${movedCount} برنامه به روزهای آینده منتقل شد.${remainingCount > 0 ? ` ${remainingCount} برنامه به دلیل کمبود ظرفیت در تاریخ قبلی باقی ماند.` : ""}`
: `${movedCount} overdue tasks rescheduled.${remainingCount > 0 ? ` ${remainingCount} tasks could not be moved because of limited capacity.` : ""}`
);
};

const completedCount = plans.filter(
(plan) => plan.completed
).length;

const pendingCount = plans.length - completedCount;

const totalMinutes = plans.reduce(
(total, plan) => total + plan.duration,
0
);

const completedMinutes = plans
.filter((plan) => plan.completed)
.reduce((total, plan) => total + plan.duration, 0);

const progress = plans.length
? Math.round((completedCount / plans.length) * 100)
: 0;

const weeklyCapacity = Object.values(availability).reduce(
(total, value) => total + value,
0
);

if (!loaded) return null;

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
NABZ / ADAPTIVE STUDY PLANNER
</p>

<h1 className="text-3xl font-bold sm:text-4xl">
{isFa ? "برنامه‌ریز هوشمند" : "Adaptive Study Planner"}
</h1>

<p className="mt-2 text-sm text-slate-400">
{isFa
? "برنامه‌ای متناسب با زمان و اهداف واقعی تو."
: "A study plan adapted to your time and goals."}
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
<section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
<div className="rounded-2xl border border-violet-400/20 bg-[#111a30] p-6">
<p className="text-sm text-slate-400">
{isFa ? "کل وظایف" : "Total Tasks"}
</p>
<h2 className="mt-4 text-3xl font-bold text-violet-300">
{plans.length}
</h2>
</div>

<div className="rounded-2xl border border-cyan-400/20 bg-[#111a30] p-6">
<p className="text-sm text-slate-400">
{isFa ? "تکمیل‌شده" : "Completed Tasks"}
</p>
<h2 className="mt-4 text-3xl font-bold text-cyan-300">
{completedCount}
</h2>
</div>

<div className="rounded-2xl border border-red-400/20 bg-[#111a30] p-6">
<p className="text-sm text-slate-400">
{isFa ? "عقب‌افتاده" : "Overdue Tasks"}
</p>
<h2 className="mt-4 text-3xl font-bold text-red-300">
{overduePlans.length}
</h2>
</div>

<div className="rounded-2xl border border-amber-400/20 bg-[#111a30] p-6">
<p className="text-sm text-slate-400">
{isFa ? "ظرفیت هفتگی" : "Weekly Availability"}
</p>
<h2 className="mt-4 text-3xl font-bold text-amber-300">
{formatMinutes(weeklyCapacity)}
</h2>
</div>
</section>

{/* Weekly Availability */}
<section className="mb-10 rounded-3xl border border-white/10 bg-[#111a30] p-6 sm:p-8">
<div className="mb-6">
<p className="mb-2 text-sm font-medium text-cyan-400">
WEEKLY AVAILABILITY
</p>

<h2 className="text-xl font-bold">
{isFa ? "زمان آزاد هفتگی" : "Weekly Study Availability"}
</h2>

<p className="mt-2 text-sm text-slate-400">
{isFa
? "برای هر روز مشخص کن چند دقیقه فرصت مطالعه داری. برای روز استراحت عدد صفر وارد کن."
: "Set your available study minutes for each day. Enter zero for rest days."}
</p>
</div>

<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
{WEEK_DAYS.map((day) => (
<div
key={day.id}
className="rounded-2xl border border-white/10 bg-[#080d1c] p-4"
>
<label className="mb-3 block text-sm font-semibold">
{isFa ? day.fa : day.en}
</label>

<div className="flex items-center gap-2">
<input
type="number"
min="0"
max="1440"
step="30"
value={availability[day.id] ?? 0}
onChange={(event) =>
updateAvailability(day.id, event.target.value)
}
className="w-full rounded-lg border border-white/10 bg-[#111a30] px-3 py-3 text-white outline-none focus:border-violet-400"
/>

<span className="text-xs text-slate-400">
{isFa ? "دقیقه" : "min"}
</span>
</div>

<p className="mt-2 text-xs text-slate-500">
{(availability[day.id] ?? 0) === 0
? isFa
? "روز استراحت"
: "Rest day"
: formatMinutes(availability[day.id] ?? 0)}
</p>
</div>
))}
</div>

<div className="mt-6 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
<p className="text-sm text-cyan-300">
{isFa
? `ظرفیت کل هفتگی تو: ${formatMinutes(weeklyCapacity)}`
: `Your total weekly capacity: ${formatMinutes(weeklyCapacity)}`}
</p>
</div>
</section>

{/* Smart Planner */}
<section className="mb-10 overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#171d3b] via-[#142747] to-[#102b3c] p-6 sm:p-8">
<div className="flex flex-wrap items-center justify-between gap-5">
<div>
<p className="mb-2 text-sm font-medium text-cyan-300">
NABZ SMART ENGINE
</p>

<h2 className="text-2xl font-bold">
{isFa ? "ساخت برنامه هوشمند" : "Generate Smart Plan"}
</h2>

<p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
{isFa
? "NABZ زمان مطالعه قبلی، اهداف درس‌ها و ظرفیت آزاد هفتگی تو را بررسی می‌کند و برنامه‌ای برای هفت روز آینده می‌سازد."
: "NABZ uses your study history, subject targets and weekly availability to create a seven-day plan."}
</p>
</div>

<button
type="button"
onClick={generateSmartPlan}
disabled={subjects.length === 0 || aiPlanning}
className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-7 py-4 font-bold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
>
{aiPlanning ? (isFa ? "در حال طراحی برنامه با GPT..." : "GPT is building your plan...") : `✧ ${isFa ? "تولید برنامه هوشمند" : "Generate My Plan"}` }
</button>
</div>

{message && (
<div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-200">
{message}
</div>
)}

<p className="mt-4 text-xs text-slate-400">
{isFa
? "برنامه‌های قبلی حفظ می‌شوند و زمان آن‌ها از ظرفیت روزانه کم خواهد شد."
: "Existing plans are preserved and count against daily availability."}
</p>
</section>

{/* Smart Rescheduling */}
<section className="mb-10 rounded-3xl border border-red-400/20 bg-[#17182b] p-6 sm:p-8">
<div className="flex flex-wrap items-center justify-between gap-5">
<div>
<p className="mb-2 text-sm font-medium text-red-300">
NABZ / SMART RESCHEDULING
</p>

<h2 className="text-2xl font-bold">
{isFa
? "مدیریت برنامه‌های عقب‌افتاده"
: "Overdue Plan Management"}
</h2>

<p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
{isFa
? "برنامه‌های انجام‌نشده گذشته را شناسایی کن و آن‌ها را با توجه به ظرفیت آزاد روزهای آینده زمان‌بندی مجدد کن."
: "Find unfinished past tasks and move them into future days according to your available capacity."}
</p>
</div>

<button
type="button"
onClick={rescheduleOverduePlans}
disabled={overduePlans.length === 0}
className="rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-7 py-4 font-bold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
>
↻ {isFa ? "زمان‌بندی مجدد" : "Reschedule Tasks"}
</button>
</div>

<div className="mt-6 grid gap-4 sm:grid-cols-2">
<div className="rounded-2xl border border-red-400/10 bg-red-400/5 p-5">
<p className="text-sm text-slate-400">
{isFa ? "برنامه‌های عقب‌افتاده" : "Overdue Tasks"}
</p>
<p className="mt-2 text-3xl font-bold text-red-300">
{overduePlans.length}
</p>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
<p className="text-sm text-slate-400">
{isFa ? "برنامه‌های آینده" : "Upcoming Pending Tasks"}
</p>
<p className="mt-2 text-3xl font-bold text-cyan-300">
{futurePendingPlans.length}
</p>
</div>
</div>

{overduePlans.length > 0 ? (
<div className="mt-5 rounded-xl border border-red-400/10 bg-red-400/5 p-4">
<p className="text-sm text-red-200">
{isFa
? `${overduePlans.length} برنامه هنوز تکمیل نشده و تاریخ آن گذشته است.`
: `${overduePlans.length} unfinished tasks have passed their scheduled dates.`}
</p>
</div>
) : (
<div className="mt-5 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
<p className="text-sm text-cyan-200">
{isFa
? "عالیه! هیچ برنامه عقب‌افتاده‌ای نداری."
: "Great! You have no overdue tasks."}
</p>
</div>
)}
</section>

{/* Add Manual Plan */}
<section className="mb-10 rounded-3xl border border-white/10 bg-[#111a30] p-6 sm:p-8">
<h2 className="mb-6 text-xl font-bold">
{isFa ? "افزودن برنامه دستی" : "Create Manual Plan"}
</h2>

{subjects.length === 0 ? (
<div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
<p className="font-semibold text-amber-300">
{isFa
? "ابتدا باید یک درس اضافه کنی."
: "You need to add a subject first."}
</p>

<Link
href={`/${locale}/subjects`}
className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-semibold"
>
{isFa ? "رفتن به درس‌های من" : "Go to My Subjects"}
</Link>
</div>
) : (
<form onSubmit={addPlan} className="grid gap-4 sm:grid-cols-2">
<input
value={title}
onChange={(event) => setTitle(event.target.value)}
placeholder={
isFa
? "عنوان وظیفه، مثلاً مطالعه فصل اول"
: "Task title, e.g. Study chapter one"
}
required
className="rounded-xl border border-white/10 bg-[#080d1c] px-4 py-4 text-white outline-none focus:border-violet-400 sm:col-span-2"
/>

<select
value={subjectId}
onChange={(event) => setSubjectId(event.target.value)}
required
className="rounded-xl border border-white/10 bg-[#080d1c] px-4 py-4 text-white outline-none focus:border-violet-400"
>
<option value="">
{isFa ? "انتخاب درس" : "Select Subject"}
</option>

{subjects.map((subject) => (
<option key={subject.id} value={subject.id}>
{subject.name}
</option>
))}
</select>

<input
type="date"
value={date}
onChange={(event) => setDate(event.target.value)}
required
className="rounded-xl border border-white/10 bg-[#080d1c] px-4 py-4 text-white outline-none focus:border-violet-400"
/>

<input
type="number"
min="1"
max="1440"
value={duration}
onChange={(event) => setDuration(event.target.value)}
required
placeholder={isFa ? "مدت مطالعه به دقیقه" : "Duration in minutes"}
className="rounded-xl border border-white/10 bg-[#080d1c] px-4 py-4 text-white outline-none focus:border-violet-400"
/>

<button
type="submit"
className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-4 font-bold transition hover:brightness-110"
>
+ {isFa ? "افزودن به برنامه" : "Add to Planner"}
</button>
</form>
)}
</section>

{/* Progress */}
<section className="mb-10 rounded-2xl border border-white/10 bg-[#111a30] p-6">
<div className="mb-3 flex items-center justify-between">
<h2 className="font-bold">
{isFa ? "پیشرفت برنامه" : "Plan Progress"}
</h2>

<span className="text-sm text-cyan-300">
{progress}%
</span>
</div>

<div className="h-3 overflow-hidden rounded-full bg-white/10">
<div
className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
style={{ width: `${progress}%` }}
/>
</div>

<div className="mt-3 flex justify-between text-xs text-slate-500">
<span>
{completedCount} {isFa ? "تکمیل‌شده" : "completed"}
</span>
<span>
{pendingCount} {isFa ? "باقی‌مانده" : "remaining"}
</span>
</div>

<p className="mt-3 text-xs text-slate-400">
{isFa
? `زمان تکمیل‌شده: ${formatMinutes(completedMinutes)} از ${formatMinutes(totalMinutes)}`
: `Completed time: ${formatMinutes(completedMinutes)} of ${formatMinutes(totalMinutes)}`}
</p>
</section>

{/* Task List */}
<section>
<div className="mb-5 flex items-center justify-between">
<h2 className="text-xl font-bold">
{isFa ? "برنامه‌های من" : "My Plans"}
</h2>

<span className="text-sm text-slate-400">
{plans.length} {isFa ? "وظیفه" : "tasks"}
</span>
</div>

{plans.length === 0 ? (
<div className="rounded-3xl border border-dashed border-white/15 bg-[#111a30] p-12 text-center">
<div className="mb-4 text-5xl">📅</div>

<h3 className="font-semibold text-slate-300">
{isFa ? "هنوز برنامه‌ای نساختی." : "No plans yet."}
</h3>

<p className="mt-2 text-sm text-slate-500">
{isFa
? "از قسمت برنامه هوشمند یا فرم دستی شروع کن."
: "Start with the smart planner or manual form."}
</p>
</div>
) : (
<div className="space-y-3">
{plans.map((plan) => {
const isOverdue =
!plan.completed && plan.date < today;

return (
<article
key={plan.id}
className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 transition ${
plan.completed
? "border-cyan-400/20 bg-cyan-400/5"
: isOverdue
? "border-red-400/30 bg-red-400/5"
: "border-white/10 bg-[#111a30]"
}`}
>
<div className="flex min-w-0 items-center gap-4">
<button
type="button"
onClick={() => togglePlan(plan.id)}
aria-label={
plan.completed
? "Mark as incomplete"
: "Mark as complete"
}
className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
plan.completed
? "border-cyan-400 bg-cyan-400 text-[#080d1c]"
: "border-white/20 hover:border-cyan-400"
}`}
>
{plan.completed ? "✓" : ""}
</button>

<div className="min-w-0">
<h3
className={`font-semibold ${
plan.completed
? "text-slate-500 line-through"
: "text-white"
}`}
>
{plan.title}
</h3>

<div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
<span>{getSubjectName(plan.subjectId)}</span>
<span>{formatDate(plan.date)}</span>
<span>
{plan.duration} {isFa ? "دقیقه" : "min"}
</span>
</div>
</div>
</div>

<div className="flex items-center gap-3">
<span
className={`rounded-full px-3 py-1 text-xs ${
plan.completed
? "bg-cyan-400/10 text-cyan-300"
: isOverdue
? "bg-red-400/10 text-red-300"
: "bg-amber-400/10 text-amber-300"
}`}
>
{plan.completed
? isFa
? "تکمیل‌شده"
: "Completed"
: isOverdue
? isFa
? "عقب‌افتاده"
: "Overdue"
: isFa
? "در انتظار"
: "Pending"}
</span>

<button
type="button"
onClick={() => deletePlan(plan.id)}
className="rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-400/10"
>
{isFa ? "حذف" : "Delete"}
</button>
</div>
</article>
);
})}
</div>
)}
</section>

<footer className="mt-16 border-t border-white/10 py-6 text-center text-xs text-slate-500">
NABZ © 2026 — THE PULSE OF LEARNING
</footer>
</div>
</main>
);
}

