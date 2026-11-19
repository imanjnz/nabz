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

type GoalHistory = {
[date: string]: boolean;
};

export default function GoalsPage() {
const locale = useLocale();
const isFa = locale === "fa";

const [sessions, setSessions] = useState<StudySession[]>([]);
const [dailyGoal, setDailyGoal] = useState(120);
const [goalInput, setGoalInput] = useState("120");
const [goalHistory, setGoalHistory] = useState<GoalHistory>({});
const [loaded, setLoaded] = useState(false);
const [message, setMessage] = useState("");

const getDateKey = (date: Date) => {
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;
};

const todayKey = getDateKey(new Date());

useEffect(() => {
try {
const savedSessions = localStorage.getItem("nabz-study-sessions");
const savedGoal = localStorage.getItem("nabz-daily-goal");
const savedHistory = localStorage.getItem("nabz-goal-history");

if (savedSessions) {
const parsed = JSON.parse(savedSessions);
if (Array.isArray(parsed)) setSessions(parsed);
}

if (savedGoal) {
const value = Number(savedGoal);

if (Number.isFinite(value) && value >= 1 && value <= 1440) {
setDailyGoal(value);
setGoalInput(String(value));
}
}

if (savedHistory) {
const parsed = JSON.parse(savedHistory);
if (parsed && typeof parsed === "object") {
setGoalHistory(parsed);
}
}
} catch (error) {
console.error("NABZ Goals loading error:", error);
}

setLoaded(true);
}, []);

const todayDuration = sessions
.filter((session) => {
const sessionDate = new Date(session.date);

return (
!Number.isNaN(sessionDate.getTime()) &&
getDateKey(sessionDate) === todayKey
);
})
.reduce((total, session) => total + session.duration, 0);

const goalInSeconds = dailyGoal * 60;

const progress = Math.min(
Math.round((todayDuration / goalInSeconds) * 100),
100
);

const goalCompleted = todayDuration >= goalInSeconds;

const studyDays = useMemo(() => {
const days = new Set<string>();

sessions.forEach((session) => {
const date = new Date(session.date);

if (session.duration > 0 && !Number.isNaN(date.getTime())) {
days.add(getDateKey(date));
}
});

return days;
}, [sessions]);

const streak = useMemo(() => {
let count = 0;
const cursor = new Date();

if (!studyDays.has(todayKey)) {
cursor.setDate(cursor.getDate() - 1);
}

while (studyDays.has(getDateKey(cursor))) {
count++;
cursor.setDate(cursor.getDate() - 1);
}

return count;
}, [studyDays, todayKey]);

const bestStreak = useMemo(() => {
const sortedDays = Array.from(studyDays).sort();

let best = 0;
let current = 0;
let previousDate: Date | null = null;

sortedDays.forEach((key) => {
const date = new Date(`${key}T12:00:00`);

if (previousDate) {
const difference = Math.round(
(date.getTime() - previousDate.getTime()) /
(1000 * 60 * 60 * 24)
);

current = difference === 1 ? current + 1 : 1;
} else {
current = 1;
}

best = Math.max(best, current);
previousDate = date;
});

return best;
}, [studyDays]);

const weeklyActiveDays = useMemo(() => {
const start = new Date();
const offset = (start.getDay() + 1) % 7;

start.setDate(start.getDate() - offset);

let count = 0;

for (let index = 0; index < 7; index++) {
const date = new Date(start);
date.setDate(start.getDate() + index);

if (studyDays.has(getDateKey(date))) {
count++;
}
}

return count;
}, [studyDays]);

const historyDays = Object.values(goalHistory).filter(
(completed) => completed === true
).length;

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

const saveGoal = () => {
const value = Number(goalInput);

if (
goalInput.trim() === "" ||
!Number.isFinite(value) ||
!Number.isInteger(value) ||
value < 1 ||
value > 1440
) {
setMessage(
isFa
? "لطفاً عددی صحیح بین ۱ تا ۱۴۴۰ دقیقه وارد کن."
: "Enter a whole number between 1 and 1440 minutes."
);
return;
}

try {
localStorage.setItem("nabz-daily-goal", String(value));

setDailyGoal(value);
setGoalInput(String(value));

setMessage(
isFa
? "هدف روزانه با موفقیت ذخیره شد."
: "Daily goal saved successfully."
);
} catch (error) {
console.error(error);
setMessage(
isFa
? "ذخیره هدف انجام نشد. فضای ذخیره‌سازی مرورگر را بررسی کن."
: "Could not save the goal. Check browser storage."
);
}
};

const saveTodayProgress = () => {
const updatedHistory = {
...goalHistory,
[todayKey]: goalCompleted,
};

try {
localStorage.setItem(
"nabz-goal-history",
JSON.stringify(updatedHistory)
);

setGoalHistory(updatedHistory);

setMessage(
goalCompleted
? isFa
? "آفرین! تکمیل هدف امروز ثبت شد."
: "Great! Today's completed goal was saved."
: isFa
? "وضعیت امروز ثبت شد؛ هنوز به هدف روزانه نرسیده‌ای."
: "Today's status was saved; your goal is not complete yet."
);
} catch (error) {
console.error(error);
setMessage(
isFa
? "ثبت وضعیت امروز انجام نشد."
: "Could not save today's status."
);
}
};

if (!loaded) {
return (
<main className="min-h-screen bg-[#080d1a] p-10 text-white">
{isFa ? "در حال بارگذاری..." : "Loading..."}
</main>
);
}

return (
<main
dir={isFa ? "rtl" : "ltr"}
className="min-h-screen bg-[#080d1a] px-5 py-8 text-white md:px-10"
>
<div className="mx-auto max-w-6xl">

<header className="mb-8 flex flex-wrap items-center justify-between gap-4">
<div>
<Link
  href={`/${locale}/dashboard`}
  className="mb-3 inline-block text-sm text-cyan-400 hover:text-cyan-300"
>
  ← {isFa ? "بازگشت به داشبورد" : "Back to Dashboard"}
</Link>
<h1 className="text-3xl font-bold">
{isFa ? "اهداف و استمرار مطالعه" : "Goals & Consistency"}
</h1>

<p className="mt-2 text-sm text-gray-400">
{isFa
? "هر روز یک قدم به هدف یادگیری‌ات نزدیک‌تر شو."
: "Get closer to your learning goals every day."}
</p>
</div>

<Link
href={`/${locale}/study`}
className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-semibold"
>
{isFa ? "شروع مطالعه ↗" : "Start Studying ↗"}
</Link>
</header>

<section className="mb-6 rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#171d3b] via-[#111b35] to-[#0c2635] p-7 md:p-9">

<div className="flex flex-wrap items-start justify-between gap-5">
<div>
<p className="text-sm text-gray-400">
{isFa ? "هدف مطالعه امروز" : "Today's Study Goal"}
</p>

<h2 className="mt-3 text-3xl font-bold">
{formatDuration(todayDuration)}
<span className="mx-2 text-lg text-gray-500">
/ {formatDuration(goalInSeconds)}
</span>
</h2>

<p className="mt-2 text-sm text-cyan-300">
{goalCompleted
? isFa
? "هدف امروزت تکمیل شد!"
: "Daily goal completed!"
: isFa
? `${formatDuration(goalInSeconds - todayDuration)} باقی مانده`
: `${formatDuration(goalInSeconds - todayDuration)} remaining`}
</p>
</div>

<div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-cyan-400/30 bg-cyan-400/5">
<span className="text-2xl font-bold text-cyan-300">
{progress}%
</span>
</div>
</div>

<div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10">
<div
className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-700"
style={{ width: `${progress}%` }}
/>
</div>

<div className="mt-7 flex flex-wrap items-end gap-3">
<div className="flex-1">
<label className="mb-2 block text-xs text-gray-400">
{isFa ? "هدف روزانه به دقیقه" : "Daily goal in minutes"}
</label>

<input
type="number"
min="1"
max="1440"
step="1"
value={goalInput}
onChange={(event) => {
setGoalInput(event.target.value);
setMessage("");
}}
className="w-full rounded-xl border border-white/10 bg-[#080d1a]/70 px-4 py-3 text-white outline-none focus:border-violet-400"
/>
</div>

<button
type="button"
onClick={saveGoal}
className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold hover:bg-violet-500"
>
{isFa ? "ذخیره هدف" : "Save Goal"}
</button>

<button
type="button"
onClick={saveTodayProgress}
className="rounded-xl border border-cyan-400/30 px-6 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10"
>
{isFa ? "ثبت وضعیت امروز" : "Save Today's Status"}
</button>
</div>

{message && (
<p
role="status"
className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200"
>
{message}
</p>
)}
</section>

<section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

{[
{
label: isFa ? "زنجیره فعلی" : "Current Streak",
value: `${streak} 🔥`,
detail: isFa ? "روز متوالی مطالعه" : "Consecutive study days",
color: "text-orange-300",
},
{
label: isFa ? "بهترین رکورد" : "Best Streak",
value: `${bestStreak} 🏆`,
detail: isFa ? "بیشترین روز متوالی" : "Longest streak",
color: "text-violet-300",
},
{
label: isFa ? "روزهای فعال این هفته" : "Active Days This Week",
value: `${weeklyActiveDays}/7`,
detail: isFa ? "روز دارای مطالعه" : "Days with study activity",
color: "text-cyan-300",
},
{
label: isFa ? "اهداف تکمیل‌شده" : "Completed Goals",
value: String(historyDays),
detail: isFa ? "روزهای ثبت‌شده به عنوان موفق" : "Saved successful days",
color: "text-emerald-300",
},
].map((item) => (
<div
key={item.label}
className="rounded-2xl border border-white/10 bg-[#101a2c] p-5"
>
<p className="text-sm text-gray-400">{item.label}</p>
<h2 className={`mt-4 text-3xl font-bold ${item.color}`}>
{item.value}
</h2>
<p className="mt-2 text-xs text-gray-500">{item.detail}</p>
</div>
))}
</section>

<section className="rounded-3xl border border-white/10 bg-[#101a2c] p-6 md:p-8">
<h2 className="text-xl font-bold">
{isFa ? "استمرار مطالعه این هفته" : "This Week's Consistency"}
</h2>

<p className="mt-2 text-sm text-gray-400">
{isFa
? "روزهایی که حداقل یک جلسه مطالعه ثبت کرده‌ای."
: "Days with at least one recorded study session."}
</p>

<div className="mt-7 grid grid-cols-7 gap-2">
{(isFa
? ["ش", "ی", "د", "س", "چ", "پ", "ج"]
: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]
).map((day, index) => {
const start = new Date();
const offset = (start.getDay() + 1) % 7;
start.setDate(start.getDate() - offset + index);

const key = getDateKey(start);
const active = studyDays.has(key);
const isToday = key === todayKey;

return (
<div key={key} className="text-center">
<p className="mb-3 text-xs text-gray-500">{day}</p>

<div
className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${
active
? "bg-gradient-to-br from-violet-500 to-cyan-400 text-white"
: "border border-white/10 bg-white/5 text-gray-500"
} ${
isToday
? "ring-2 ring-cyan-300 ring-offset-2 ring-offset-[#101a2c]"
: ""
}`}
>
{active ? "✓" : "·"}
</div>
</div>
);
})}
</div>
</section>

<footer className="mt-8 border-t border-white/10 py-6 text-center text-xs text-gray-600">
NABZ — The Pulse of Learning
</footer>

</div>
</main>
);
}

