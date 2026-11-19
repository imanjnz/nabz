
"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type StudySession = {
  id: string;
  duration: number;
  date: string;
  subjectId?: string;
};

type Subject = {
  id: string;
  name: string;
};

function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function Icon({
  name,
  size = 22,
}: {
  name: string;
  size?: number;
}) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-7h6v7" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z" /><path d="M4 5.5v14A2.5 2.5 0 0 1 6.5 17H20" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="M8 14h3M8 17h3" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    chart: <><path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7" /></>,
    exam: <><path d="M7 3h8l5 5v13H7z" /><path d="M15 3v5h5M10 13h7M10 17h7" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    sparkle: <><path d="m12 2 1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-2.8z" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    pulse: <><path d="M2 12h4l3-8 5 16 3-8h5" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || paths.sparkle}
    </svg>
  );
}

export default function Dashboard() {
  const locale = useLocale();
  const isFa = locale === "fa";

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(120);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem("nabz-study-sessions");
      const savedSubjects = localStorage.getItem("nabz-subjects");
      const savedGoal = localStorage.getItem("nabz-daily-goal");

      if (savedSessions) {
        const data = JSON.parse(savedSessions);
        if (Array.isArray(data)) setSessions(data);
      }

      if (savedSubjects) {
        const data = JSON.parse(savedSubjects);
        if (Array.isArray(data)) setSubjects(data);
      }

      if (savedGoal) {
        const value = Number(savedGoal);
        if (Number.isFinite(value) && value > 0) {
          setDailyGoalMinutes(value);
        }
      }
    } catch {
      console.error("Unable to read NABZ dashboard data.");
    }

    setLoaded(true);
  }, []);

  const today = new Date();
  const todayKey = dateKey(today);

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const monthlyGoalSeconds = dailyGoalMinutes * daysInMonth * 60;

  const monthlySessions = sessions.filter((session) => {
    const date = new Date(session.date);
    const duration = Number(session.duration);

    return (
      !Number.isNaN(date.getTime()) &&
      Number.isFinite(duration) &&
      duration > 0 &&
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const monthlySeconds = monthlySessions.reduce(
    (sum, session) => sum + Number(session.duration),
    0
  );

  const monthlyProgress =
    monthlyGoalSeconds > 0
      ? Math.min(
          Math.round((monthlySeconds / monthlyGoalSeconds) * 100),
          100
        )
      : 0;

  const weeklyData = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    // شروع هفته از شنبه
    const daysSinceSaturday = (start.getDay() + 1) % 7;
    start.setDate(start.getDate() - daysSinceSaturday);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);

      const key = dateKey(date);

      const seconds = sessions
        .filter((session) => {
          const sessionDate = new Date(session.date);

          return (
            !Number.isNaN(sessionDate.getTime()) &&
            dateKey(sessionDate) === key
          );
        })
        .reduce(
          (sum, session) => sum + (Number(session.duration) || 0),
          0
        );

      return {
        key,
        seconds,
        label: date.toLocaleDateString(
          isFa ? "fa-IR" : "en-US",
          { weekday: "long" }
        ),
      };
    });
  }, [sessions, isFa]);

  // محاسبه جلسات هفته جاری از شنبه تا جمعه
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);

  const daysSinceSaturday = (weekStart.getDay() + 1) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceSaturday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weeklySessions = sessions.filter((session) => {
    const date = new Date(session.date);
    const duration = Number(session.duration);

    return (
      !Number.isNaN(date.getTime()) &&
      Number.isFinite(duration) &&
      duration > 0 &&
      date >= weekStart &&
      date < weekEnd
    );
  });

  const weeklyStudySeconds = weeklySessions.reduce(
    (sum, session) => sum + Number(session.duration),
    0
  );

  const todaySessions = sessions.filter((session) => {
    const date = new Date(session.date);

    return (
      !Number.isNaN(date.getTime()) &&
      dateKey(date) === todayKey
    );
  });

  const todaySeconds = todaySessions.reduce(
    (sum, session) => sum + (Number(session.duration) || 0),
    0
  );

  const maxChartValue = Math.max(
    ...weeklyData.map((day) => day.seconds),
    1
  );

  const formatDuration = (seconds: number) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);

    if (hours > 0) {
      return isFa
        ? `${hours} ساعت و ${minutes} دقیقه`
        : `${hours}h ${minutes}m`;
    }

    return isFa ? `${minutes} دقیقه` : `${minutes} min`;
  };

  const formattedDate = today.toLocaleDateString(
    isFa ? "fa-IR" : "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const formattedMonthlyGoal = formatDuration(monthlyGoalSeconds);

  const navigation = [
    { label: isFa ? "داشبورد" : "Dashboard", icon: "home", href: `/${locale}/dashboard`, active: true },
    { label: isFa ? "درس‌ها" : "Subjects", icon: "book", href: `/${locale}/subjects` },
    { label: isFa ? "جلسات مطالعه" : "Study Sessions", icon: "clock", href: `/${locale}/sessions` },
    { label: isFa ? "برنامه‌ریز" : "Planner", icon: "calendar", href: `/${locale}/planner` },
    { label: isFa ? "تقویم" : "Calendar", icon: "calendar", href: `/${locale}/calendar` },
    { label: isFa ? "اهداف" : "Goals", icon: "target", href: `/${locale}/goals` },
    { label: isFa ? "تحلیل عملکرد" : "Analytics", icon: "chart", href: `/${locale}/analytics` },
    { label: isFa ? "آزمون‌ساز" : "Exam Generator", icon: "exam", href: `/${locale}/exams` },
  ];

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080f23] text-white">
        {isFa ? "در حال بارگذاری..." : "Loading..."}
      </main>
    );
  }

  return (
    <main
      dir={isFa ? "rtl" : "ltr"}
      className="min-h-screen overflow-x-hidden bg-[#080f23] text-white"
    >
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute right-1/3 top-1/3 h-96 w-96 rounded-full bg-cyan-500/[0.06] blur-[150px]" />
      </div>

      {/* Sidebar */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-[215px] border-l border-[#26365d] bg-[#091329] px-4 py-6 lg:flex lg:flex-col">

        {/* NABZ logo */}
        <Link
          href={`/${locale}/dashboard`}
          className="mb-9 flex items-center justify-center gap-3 py-2"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-cyan-400 text-cyan-300 shadow-[0_0_20px_#00d9e955]">
            <Icon name="pulse" size={34} />
          </div>

          <div className="text-center">
            <p className="text-2xl font-black tracking-tight text-white">
              {isFa ? "نبض" : "NABZ"}
            </p>
            <p className="text-[9px] tracking-[.16em] text-slate-400">
              Nabz
            </p>
          </div>
        </Link>

        <nav className="space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm text-slate-300 transition-all duration-200 before:absolute before:-left-4 before:right-0 before:top-0 before:bottom-0 before:rounded-xl before:transition-all before:duration-200 hover:before:bg-gradient-to-l hover:before:from-cyan-500/20 hover:before:to-blue-500/10 hover:text-cyan-300"
            >
              <span className="absolute -left-4 top-0 bottom-0 z-10 w-1 rounded-r-full bg-cyan-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

              <span className="relative z-10 flex w-7 justify-center">
                <Icon name={item.icon} size={21} />
              </span>

              <span className="relative z-10">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <Link
            href={`/${locale}/`}
            className="group relative flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm text-slate-300 transition-all duration-200 before:absolute before:-left-4 before:right-0 before:top-0 before:bottom-0 before:rounded-xl before:transition-all before:duration-200 hover:before:bg-gradient-to-l hover:before:from-cyan-500/20 hover:before:to-blue-500/10 hover:text-cyan-300"
          >
            <span className="absolute -left-4 top-0 bottom-0 z-10 w-1 rounded-r-full bg-cyan-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <span className="w-7 text-center text-xl">↪</span>
            {isFa ? "صفحه اصلی" : "Home"}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative min-h-screen lg:mr-[215px]">

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between border-b border-[#26365d] bg-[#080f23]/95 px-5 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-300/20 bg-gradient-to-br from-indigo-400/30 to-blue-500/20 text-xl">
              ◉
            </div>

            <div>
              <p className="text-sm font-bold">
                {isFa ? "کاربر نبض" : "NABZ User"}
              </p>
              <p className="text-[10px] text-slate-500">
                {isFa ? "فضای یادگیری شخصی" : "Personal Learning Space"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300 md:gap-5">
            <span className="hidden sm:block">{formattedDate}</span>
            <Icon name="calendar" size={19} />

            <span className="mx-1 h-6 w-px bg-white/10" />

            <Link
              href="/en/dashboard"
              className={!isFa ? "text-cyan-300" : "text-slate-500"}
            >
              EN
            </Link>

            <Link
              href="/fa/dashboard"
              className={isFa ? "rounded-md bg-white/10 px-2 py-1 text-white" : "text-slate-500"}
            >
              فا
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] space-y-7 p-5 md:p-7 xl:p-8">

          {/* Welcome */}
          <section className="relative flex min-h-[150px] items-center py-5 md:py-8">

            {/* Neon Heartbeat Line */}
            <div className="pointer-events-none absolute left-[-29px] top-1/2 h-28 w-[calc(62%+29px)] -translate-y-1/2">
              <svg
                viewBox="0 0 800 120"
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
              >
                <defs>
                  <linearGradient id="heartbeatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#26D9D0" stopOpacity="0.05" />
                    <stop offset="45%" stopColor="#26D9D0" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#00E5FF" stopOpacity="1" />
                  </linearGradient>

                  <filter id="heartbeatGlow" x="-20%" y="-100%" width="140%" height="300%">
                    <feGaussianBlur stdDeviation="5" />
                  </filter>
                </defs>

                <path
                  className="heartbeat-glow"
                  d="M0 60 H610 L628 58 L642 49 L654 72 L670 34 L690 96 L714 8 L738 76 L754 48 L770 60 H800"
                  fill="none"
                  stroke="#00DFFF"
                  strokeWidth="4"
                  opacity="0.65"
                  filter="url(#heartbeatGlow)"
                />

                <path
                  d="M0 60 H610 L628 58 L642 49 L654 72 L670 34 L690 96 L714 8 L738 76 L754 48 L770 60 H800"
                  fill="none"
                  stroke="url(#heartbeatGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Welcome Text */}
            <div className="relative z-10 w-full text-right">
              <h1 className="text-3xl font-black leading-relaxed md:text-4xl">
                {isFa ? "سلام، کاربر نبض!" : "Hello, NABZ User!"}
              </h1>

              <p className="mt-3 text-sm leading-8 text-slate-400">
                {isFa
                  ? "امیدواریم امروز هم قدم بزرگی در مسیر یادگیری برداری."
                  : "We hope you take another great step in your learning journey today."}
              </p>
            </div>
          </section>

          {/* Statistics */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* 1. Quality score */}
            <div className="rounded-[22px] border border-violet-400/20 bg-gradient-to-br from-[#1b1b45] to-[#101831] p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">
                  {isFa ? "امتیاز کیفیت این هفته" : "This Week's Quality Score"}
                </span>

                <span className="text-violet-400">
                  <Icon name="sparkle" size={25} />
                </span>
              </div>

              <p className="mt-4 text-2xl font-black text-violet-200">
                {isFa ? "در انتظار تحلیل" : "Pending analysis"}
              </p>

              <p className="mt-2 text-[11px] text-slate-500">
                {isFa
                  ? "پس از فعال‌سازی تحلیل کیفیت، امتیاز نمایش داده می‌شود."
                  : "Your score will appear when quality analysis is enabled."}
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400" />
              </div>
            </div>

            {/* 2. Weekly sessions */}
            <div className="rounded-[22px] border border-blue-400/15 bg-gradient-to-br from-[#142343] to-[#0d1831] p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">
                  {isFa ? "جلسات این هفته" : "Weekly Sessions"}
                </span>

                <span className="text-blue-400">
                  <Icon name="calendar" size={25} />
                </span>
              </div>

              <p className="mt-4 text-3xl font-black">
                {weeklySessions.length}
              </p>

              <p className="mt-4 text-xs text-slate-400">
                {isFa ? "مجموع زمان مطالعه: " : "Total study time: "}
                <span className="font-semibold text-cyan-300">
                  {formatDuration(weeklyStudySeconds)}
                </span>
              </p>
            </div>

            {/* 3. Today's study time */}
            <div className="rounded-[22px] border border-cyan-400/15 bg-gradient-to-br from-[#142343] to-[#0d1831] p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">
                  {isFa ? "زمان مطالعه امروز" : "Today's Study Time"}
                </span>

                <span className="text-cyan-400">
                  <Icon name="clock" size={25} />
                </span>
              </div>

              <p className="mt-4 text-2xl font-black">
                {formatDuration(todaySeconds)}
              </p>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  style={{
                    width: `${Math.min(
                      (todaySeconds / (dailyGoalMinutes * 60)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* 4. Monthly goal */}
            <div className="rounded-[22px] border border-cyan-400/15 bg-gradient-to-br from-[#102e3a] to-[#101831] p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">
                  {isFa ? "هدف ماهانه" : "Monthly Goal"}
                </span>

                <span className="text-cyan-400">
                  <Icon name="target" size={25} />
                </span>
              </div>

              <p className="mt-4 text-2xl font-black">
                {formattedMonthlyGoal}
              </p>

              <p className="mt-2 text-[11px] text-slate-500">
                {isFa
                  ? `میزان پیشرفت: ${monthlyProgress}٪`
                  : `Progress: ${monthlyProgress}%`}
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                  style={{ width: `${monthlyProgress}%` }}
                />
              </div>
            </div>
          </section>

          {/* Chart LEFT / Today's plan RIGHT */}
          <section
            dir="ltr"
            className="grid gap-5 xl:grid-cols-[1.8fr_1fr]"
          >

            {/* Study chart */}
            <div
              dir={isFa ? "rtl" : "ltr"}
              className="rounded-[24px] border border-[#293966] bg-gradient-to-br from-[#111d3a] to-[#0d1730] p-5 md:p-6"
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    {isFa ? "نمودار روند مطالعه" : "Study Activity"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {isFa
                      ? "میزان مطالعه از شنبه تا جمعه"
                      : "Study activity from Saturday to Friday"}
                  </p>
                </div>

                <span className="text-cyan-400">
                  <Icon name="chart" size={25} />
                </span>
              </div>

              <div
                dir="ltr"
                className="flex h-[220px] items-end justify-between gap-3 border-b border-l border-white/10 px-2 pb-0"
              >
                {weeklyData.map((day, index) => {
                  const height = day.seconds > 0
                    ? Math.max((day.seconds / maxChartValue) * 100, 5)
                    : 0;

                  return (
                    <div
                      key={day.key}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-3"
                    >
                      <div className="flex h-full w-full items-end justify-center">
                        <div
                          title={formatDuration(day.seconds)}
                          className={`w-full max-w-11 rounded-t-lg transition-all ${
                            index % 3 === 0
                              ? "bg-gradient-to-t from-violet-700 to-violet-400"
                              : "bg-gradient-to-t from-blue-700 to-cyan-400"
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      </div>

                      <span className="mb-2 max-w-full truncate text-[10px] text-slate-400 sm:text-xs">
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's plan */}
            <div
              dir={isFa ? "rtl" : "ltr"}
              className="rounded-[24px] border border-[#293966] bg-gradient-to-br from-[#111d3a] to-[#0d1730] p-5 md:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    {isFa ? "برنامه امروز" : "Today's Plan"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {formattedDate}
                  </p>
                </div>

                <span className="text-cyan-400">
                  <Icon name="calendar" size={25} />
                </span>
              </div>

              {todaySessions.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {todaySessions.map((session) => {
                    const subject = subjects.find(
                      (item) => item.id === session.subjectId
                    );

                    return (
                      <div
                        key={session.id}
                        className="flex items-center gap-3 border-b border-white/[0.06] py-3"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400 text-[#071629]">
                          <Icon name="check" size={17} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {subject?.name || (isFa ? "جلسه مطالعه" : "Study session")}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-500">
                            {formatDuration(session.duration)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
                    <Icon name="sparkle" size={27} />
                  </span>

                  <p className="mt-3 text-sm font-semibold">
                    {isFa
                      ? "هنوز جلسه‌ای برای امروز ثبت نشده"
                      : "No study sessions recorded today"}
                  </p>

                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {isFa
                      ? "بعد از ثبت مطالعه، فعالیت امروزت را اینجا می‌بینی."
                      : "Your study activity will appear here after you log a session."}
                  </p>
                </div>
              )}

              <Link
                href={`/${locale}/planner`}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#1b2851] px-4 py-3 text-sm font-bold transition hover:bg-[#253665]"
              >
                {isFa ? "مشاهده برنامه کامل" : "View Full Plan"}
                <Icon name="arrow" size={17} />
              </Link>
            </div>
          </section>

          {/* Bottom cards */}
          <section className="grid gap-5 xl:grid-cols-3">

            {/* Overall progress */}
            <div className="rounded-[24px] border border-[#293966] bg-gradient-to-br from-[#171c48] to-[#0e1733] p-6">
              <h3 className="text-lg font-bold">
                {isFa ? "پیشرفت کلی شما" : "Your Overall Progress"}
              </h3>

              <div className="mt-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm leading-7 text-slate-300">
                    {isFa ? "تعداد کل جلسات ثبت‌شده" : "Total recorded sessions"}
                  </p>

                  <p className="mt-2 text-3xl font-black text-cyan-300">
                    {sessions.length}
                  </p>

                  <Link
                    href={`/${locale}/sessions`}
                    className="mt-4 inline-block text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    {isFa ? "مشاهده تاریخچه جلسات" : "View session history"} ←
                  </Link>
                </div>

                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[9px] border-cyan-400/20 bg-cyan-400/[0.04] text-cyan-300">
                  <Icon name="sparkle" size={32} />
                </div>
              </div>
            </div>

            {/* Smart planner */}
            <div className="relative overflow-hidden rounded-[24px] border border-cyan-400/25 bg-gradient-to-br from-[#075c78] via-[#073b65] to-[#101b48] p-6">
              <span className="text-cyan-300">
                <Icon name="calendar" size={27} />
              </span>

              <h3 className="mt-3 text-lg font-black">
                {isFa ? "برنامه‌ریز هوشمند" : "Smart Planner"}
              </h3>

              <p className="mt-2 text-sm leading-7 text-cyan-50/80">
                {isFa
                  ? "برنامه مطالعه‌ات را تنظیم کن و قدم‌به‌قدم پیش برو."
                  : "Organize your study schedule and make steady progress."}
              </p>

              <div dir="ltr" className="mt-5 flex justify-start">
                <Link
                  href={`/${locale}/planner`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-cyan-950 transition hover:bg-cyan-100"
                >
                  <Icon name="calendar" size={16} />
                  {isFa ? "ساخت برنامه" : "Create Plan"}
                </Link>
              </div>
            </div>

            {/* Exam generator */}
            <div className="relative overflow-hidden rounded-[24px] border border-violet-400/30 bg-gradient-to-br from-[#5425a0] via-[#321b75] to-[#111b48] p-6">
              <span className="text-violet-200">
                <Icon name="sparkle" size={29} />
              </span>

              <h3 className="mt-3 text-lg font-black">
                {isFa ? "آزمون‌ساز هوشمند" : "Smart Exam Generator"}
              </h3>

              <p className="mt-2 text-sm leading-7 text-violet-100/80">
                {isFa
                  ? "از جزوه‌هایت آزمون بساز و خودت را بسنج!"
                  : "Generate exams from your notes and test your knowledge."}
              </p>

              <div dir="ltr" className="mt-5 flex justify-start">
                <Link
                  href={`/${locale}/exams`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 transition hover:bg-violet-100"
                >
                  <Icon name="exam" size={16} />
                  {isFa ? "شروع آزمون" : "Start Exam"}
                </Link>
              </div>
            </div>
          </section>

          <footer className="border-t border-white/10 py-6 text-center">
            <p className="text-[10px] tracking-[.2em] text-slate-600">
              NABZ — THE PULSE OF LEARNING
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
