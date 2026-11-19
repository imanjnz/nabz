"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

type StudySession = {
id: string;
duration: number;
date: string;
};

export default function StudyOverview() {
const locale = useLocale();
const isFa = locale === "fa";

const [sessions, setSessions] = useState<StudySession[]>([]);
const [loaded, setLoaded] = useState(false);

useEffect(() => {
const loadSessions = () => {
try {
const saved = localStorage.getItem("nabz-study-sessions");

if (saved) {
const parsed = JSON.parse(saved);

if (Array.isArray(parsed)) {
setSessions(parsed);
}
} else {
setSessions([]);
}
} catch {
console.error("Could not load study statistics.");
}

setLoaded(true);
};

loadSessions();

window.addEventListener("focus", loadSessions);

return () => {
window.removeEventListener("focus", loadSessions);
};
}, []);

const totalSeconds = sessions.reduce(
(total, session) => total + session.duration,
0
);

const formatTime = (total: number) => {
const hours = Math.floor(total / 3600);
const minutes = Math.floor((total % 3600) / 60);
const seconds = total % 60;

return [hours, minutes, seconds]
.map((value) => String(value).padStart(2, "0"))
.join(":");
};

if (!loaded) {
return null;
}

const stats = [
{
title: isFa ? "زمان مطالعه" : "Study Time",
value: formatTime(totalSeconds),
detail: isFa ? "مجموع زمان مطالعه ثبت‌شده" : "Total recorded study time",
icon: "◷",
},
{
title: isFa ? "جلسات مطالعه" : "Study Sessions",
value: String(sessions.length),
detail: isFa ? "تعداد جلسات تکمیل‌شده" : "Completed sessions",
icon: "▤",
},
];

return (
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
{stats.map((stat, index) => (
<div
key={stat.title}
className="rounded-2xl border border-white/10 bg-[#101a2c] p-5 transition hover:-translate-y-1 hover:border-violet-400/30"
>
<div className="flex items-center justify-between">
<p className="text-sm text-gray-400">{stat.title}</p>

<span
className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${
index === 0
? "bg-violet-500/15 text-violet-300"
: "bg-cyan-500/15 text-cyan-300"
}`}
>
{stat.icon}
</span>
</div>

<h3 className="mt-5 text-2xl font-bold tracking-wide">
{stat.value}
</h3>

<p className="mt-2 text-xs text-gray-500">{stat.detail}</p>
</div>
))}
</div>
);
}
