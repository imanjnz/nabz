
"use client";

import { useEffect, useState } from "react";
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

type Recommendation = {
  icon: string;
  title: string;
  description: string;
  type: "positive" | "info" | "warning";
};

export default function AnalyticsPage() {
  const locale = useLocale();
  const isFa = locale === "fa";

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem("nabz-study-sessions");
      const savedSubjects = localStorage.getItem("nabz-subjects");

      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed)) setSessions(parsed);
      }

      if (savedSubjects) {
        const parsed = JSON.parse(savedSubjects);
        if (Array.isArray(parsed)) setSubjects(parsed);
      }
    } catch {
      setSessions([]);
      setSubjects([]);
    }

    setLoaded(true);
  }, []);

  const today = new Date();

  const getDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatDuration = (seconds: number) => {
    const safeSeconds = Math.max(
      0,
      Number.isFinite(seconds) ? seconds : 0
    );

    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);

    if (hours > 0) {
      return isFa
        ? `${hours} ساعت و ${minutes} دقیقه`
        : `${hours}h ${minutes}m`;
    }

    return isFa ? `${minutes} دقیقه` : `${minutes}m`;
  };

  const validSessions = sessions.filter((session) => {
    if (!session || !session.id || !session.date) return false;

    const date = new Date(session.date);
    const duration = Number(session.duration);

    return (
      !Number.isNaN(date.getTime()) &&
      date <= today &&
      Number.isFinite(duration) &&
      duration > 0
    );
  });

  // Start of week: Saturday
  const startOfWeek = new Date(today);
  startOfWeek.setHours(0, 0, 0, 0);

  const dayFromSaturday = (today.getDay() + 1) % 7;

  startOfWeek.setDate(
    startOfWeek.getDate() - dayFromSaturday
  );

  // Start of previous week
  const previousWeekStart = new Date(startOfWeek);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

  // Equivalent elapsed time in previous week
  const elapsedMilliseconds =
    today.getTime() - startOfWeek.getTime();

  const previousComparisonEnd = new Date(
    previousWeekStart.getTime() + elapsedMilliseconds
  );

  const todayKey = getDateKey(today);

  // Today's sessions
  const todaySessions = validSessions.filter((session) => {
    return getDateKey(new Date(session.date)) === todayKey;
  });

  const todayDuration = todaySessions.reduce(
    (total, session) => total + Number(session.duration),
    0
  );

  // Current week sessions
  const weekSessions = validSessions.filter((session) => {
    const date = new Date(session.date);
    return date >= startOfWeek && date <= today;
  });

  const weekDuration = weekSessions.reduce(
    (total, session) => total + Number(session.duration),
    0
  );

  const weekCount = weekSessions.length;

  // Previous week sessions
  const previousWeekSessions = validSessions.filter((session) => {
    const date = new Date(session.date);

    return (
      date >= previousWeekStart &&
      date <= previousComparisonEnd
    );
  });

  const previousWeekDuration = previousWeekSessions.reduce(
    (total, session) => total + Number(session.duration),
    0
  );

  const hasPreviousData = previousWeekSessions.length > 0;

  const weeklyDifference = weekDuration - previousWeekDuration;

  const weeklyChangePercentage =
    previousWeekDuration > 0
      ? Math.round(
          (weeklyDifference / previousWeekDuration) * 100
        )
      : null;

  // All-time study
  const totalDuration = validSessions.reduce(
    (total, session) => total + Number(session.duration),
    0
  );

  const totalCount = validSessions.length;

  // Average session duration
  const averageDuration =
    weekCount > 0
      ? Math.round(weekDuration / weekCount)
      : 0;

  // Week days
  const weekDays = (() => {
    const names = isFa
      ? [
          "شنبه",
          "یکشنبه",
          "دوشنبه",
          "سه‌شنبه",
          "چهارشنبه",
          "پنجشنبه",
          "جمعه",
        ]
      : ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

    return names.map((name, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);

      const key = getDateKey(date);

      const daySessions = weekSessions.filter(
        (session) =>
          getDateKey(new Date(session.date)) === key
      );

      const duration = daySessions.reduce(
        (total, session) => total + Number(session.duration),
        0
      );

      return {
        name,
        date: date.getDate(),
        key,
        duration,
        count: daySessions.length,
      };
    });
  })();

  // Best day
  const bestDay = [...weekDays].sort(
    (a, b) => b.duration - a.duration
  )[0];

  const weeklyMaximum = Math.max(
    ...weekDays.map((day) => day.duration),
    1
  );

  // Consistency
  const activeDays = weekDays.filter(
    (day) => day.duration > 0
  ).length;

  const elapsedDays = dayFromSaturday + 1;

  const consistencyPercentage = Math.round(
    (activeDays / elapsedDays) * 100
  );

  // Subject analytics
  const subjectStats = subjects
    .filter(
      (subject) =>
        subject &&
        subject.id &&
        typeof subject.name === "string"
    )
    .map((subject) => {
      const subjectSessions = validSessions.filter(
        (session) => session.subjectId === subject.id
      );

      const duration = subjectSessions.reduce(
        (total, session) => total + Number(session.duration),
        0
      );

      const currentSessions = weekSessions.filter(
        (session) => session.subjectId === subject.id
      );

      const currentDuration = currentSessions.reduce(
        (total, session) => total + Number(session.duration),
        0
      );

      const previousSessions = previousWeekSessions.filter(
        (session) => session.subjectId === subject.id
      );

      const previousDuration = previousSessions.reduce(
        (total, session) => total + Number(session.duration),
        0
      );

      const targetHours = Number(subject.targetHours);
      const targetSeconds =
        Number.isFinite(targetHours) && targetHours > 0
          ? targetHours * 3600
          : 0;

      const progress =
        targetSeconds > 0
          ? Math.min((duration / targetSeconds) * 100, 100)
          : 0;

      const remainingSeconds = Math.max(
        targetSeconds - duration,
        0
      );

      const hasWeeklyComparison = previousSessions.length > 0;

      const weeklyChange =
        previousDuration > 0
          ? Math.round(
              ((currentDuration - previousDuration) /
                previousDuration) *
                100
            )
          : null;

      return {
        ...subject,
        duration,
        count: subjectSessions.length,
        currentDuration,
        currentCount: currentSessions.length,
        previousDuration,
        previousCount: previousSessions.length,
        hasWeeklyComparison,
        weeklyChange,
        targetSeconds,
        progress,
        remainingSeconds,
      };
    })
    .sort((a, b) => b.duration - a.duration);

  const studiedSubjects = subjectStats.filter(
    (subject) => subject.duration > 0
  );

  const topSubject = studiedSubjects[0];

  const weeklyTopSubject = [...subjectStats]
    .filter((subject) => subject.currentDuration > 0)
    .sort((a, b) => b.currentDuration - a.currentDuration)[0];

  const completedSubjects = subjectStats.filter(
    (subject) =>
      subject.targetSeconds > 0 &&
      subject.duration >= subject.targetSeconds
  );

  const subjectsWithoutStudyThisWeek = subjectStats.filter(
    (subject) =>
      subject.duration > 0 &&
      subject.currentDuration === 0
  );

  const subjectsNeedingAttention = subjectStats.filter(
    (subject) => subject.duration === 0
  );

  // Study distribution
  const getSubjectShare = (duration: number) => {
    if (totalDuration <= 0) return 0;

    return Math.round((duration / totalDuration) * 100);
  };

  // Analyst recommendations
  const getRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    if (totalCount === 0) {
      recommendations.push({
        icon: "📚",
        title: isFa
          ? "اولین قدم رو بردار"
          : "Take your first step",
        description: isFa
          ? "هنوز جلسه مطالعه‌ای ثبت نشده. اولین جلسه‌ات رو شروع کن تا تحلیل‌گر نبض بتونه الگوی یادگیریت رو بررسی کنه."
          : "No study sessions have been recorded yet. Start your first session to build your learning profile.",
        type: "info",
      });

      return recommendations;
    }

    if (weekCount === 0) {
      recommendations.push({
        icon: "📅",
        title: isFa
          ? "این هفته هنوز مطالعه‌ای ثبت نشده"
          : "No study activity this week",
        description: isFa
          ? "برای اینکه روند هفتگی قابل تحلیل باشه، یک جلسه مطالعه ثبت کن."
          : "Record a study session to start building this week's report.",
        type: "info",
      });
    } else {
      if (consistencyPercentage >= 70) {
        recommendations.push({
          icon: "🔥",
          title: isFa
            ? "استمرار خوبی داری"
            : "Good consistency",
          description: isFa
            ? `در ${activeDays} روز از ${elapsedDays} روز سپری‌شده این هفته مطالعه داشتی. همین روند رو حفظ کن.`
            : `You studied on ${activeDays} of ${elapsedDays} elapsed days this week. Keep it up.`,
          type: "positive",
        });
      } else {
        recommendations.push({
          icon: "📈",
          title: isFa
            ? "روی استمرار تمرکز کن"
            : "Focus on consistency",
          description: isFa
            ? `تا امروز در ${activeDays} روز از ${elapsedDays} روز مطالعه داشتی. سعی کن مطالعه رو در روزهای بیشتری از هفته پخش کنی.`
            : `You've studied on ${activeDays} of ${elapsedDays} elapsed days. Try spreading your study sessions across more days.`,
          type: "info",
        });
      }

      if (hasPreviousData && previousWeekDuration > 0) {
        if (weeklyDifference > 0) {
          recommendations.push({
            icon: "🚀",
            title: isFa
              ? "روند مطالعه رو به رشد است"
              : "Study time is increasing",
            description: isFa
              ? `زمان مطالعه‌ات نسبت به بازه مشابه هفته قبل ${weeklyChangePercentage}% بیشتر شده.`
              : `Your study time is ${weeklyChangePercentage}% higher than the equivalent period last week.`,
            type: "positive",
          });
        } else if (weeklyDifference < 0) {
          recommendations.push({
            icon: "💡",
            title: isFa
              ? "زمان مطالعه کاهش پیدا کرده"
              : "Study time has decreased",
            description: isFa
              ? `زمان مطالعه نسبت به بازه مشابه هفته قبل ${Math.abs(weeklyChangePercentage ?? 0)}٪ کمتر شده. برنامه این هفته رو دوباره بررسی کن.`
              : `Study time is down ${Math.abs(weeklyChangePercentage ?? 0)}% compared with the equivalent period last week. Review your schedule.`,
            type: "warning",
          });
        } else {
          recommendations.push({
            icon: "⚖️",
            title: isFa
              ? "زمان مطالعه ثابت مانده"
              : "Study time is stable",
            description: isFa
              ? "زمان مطالعه‌ات نسبت به بازه مشابه هفته قبل تغییری نداشته."
              : "Your study time is unchanged compared with the equivalent period last week.",
            type: "info",
          });
        }
      } else if (weekDuration > 0) {
        recommendations.push({
          icon: "📊",
          title: isFa
            ? "داده کافی برای مقایسه نداریم"
            : "Not enough comparison data",
          description: isFa
            ? "با ثبت جلسات بیشتر در هفته‌های آینده، روند پیشرفتت دقیق‌تر مشخص می‌شه."
            : "More recorded sessions in future weeks will make your progress trends clearer.",
          type: "info",
        });
      }
    }

    if (topSubject) {
      recommendations.push({
        icon: "🎯",
        title: isFa
          ? "نقطه قوت مطالعه تو"
          : "Your strongest study subject",
        description: isFa
          ? `بیشترین زمان مطالعه کل مربوط به «${topSubject.name}» است (${formatDuration(topSubject.duration)}).`
          : `Your most studied subject overall is "${topSubject.name}" (${formatDuration(topSubject.duration)}).`,
        type: "positive",
      });
    }

    if (subjectsWithoutStudyThisWeek.length > 0) {
      const names = subjectsWithoutStudyThisWeek
        .slice(0, 3)
        .map((subject) => subject.name)
        .join(isFa ? "، " : ", ");

      recommendations.push({
        icon: "📖",
        title: isFa
          ? "چند درس این هفته بدون مطالعه مانده‌اند"
          : "Some subjects have no study activity this week",
        description: isFa
          ? `برای درس‌های ${names} در هفته جاری جلسه‌ای ثبت نشده. اگر هنوز در برنامه‌ات هستند، زمانی برای مرورشان در نظر بگیر.`
          : `No sessions have been recorded this week for ${names}. If these subjects are still part of your plan, consider scheduling some time for them.`,
        type: "warning",
      });
    }

    if (subjectsNeedingAttention.length > 0) {
      recommendations.push({
        icon: "🧭",
        title: isFa
          ? "درس‌های بدون سابقه مطالعه"
          : "Subjects with no recorded study",
        description: isFa
          ? `برای ${subjectsNeedingAttention.map((subject) => subject.name).slice(0, 3).join("، ")} هنوز جلسه‌ای ثبت نشده.`
          : `No study sessions have been recorded for ${subjectsNeedingAttention.map((subject) => subject.name).slice(0, 3).join(", ")} yet.`,
        type: "info",
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#080d1a] p-10 text-white">
        {isFa ? "در حال بارگذاری آمار..." : "Loading analytics..."}
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
              {isFa ? "تحلیل عملکرد مطالعه" : "Study Analytics"}
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              {isFa
                ? "عملکرد و روند یادگیری خودت را بررسی کن."
                : "Understand your study performance and learning trends."}
            </p>
          </div>

          <Link
            href={`/${locale}/study`}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-semibold hover:brightness-110"
          >
            {isFa ? "شروع مطالعه ↗" : "Start Studying ↗"}
          </Link>
        </header>

        {/* Overview */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#101a2c] p-5">
            <p className="text-sm text-gray-400">
              {isFa ? "مطالعه امروز" : "Today's Study"}
            </p>

            <h2 className="mt-4 text-2xl font-bold text-cyan-300">
              {formatDuration(todayDuration)}
            </h2>

            <p className="mt-2 text-xs text-gray-500">
              {todaySessions.length} {isFa ? "جلسه" : "sessions"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101a2c] p-5">
            <p className="text-sm text-gray-400">
              {isFa ? "مطالعه این هفته" : "This Week"}
            </p>

            <h2 className="mt-4 text-2xl font-bold text-violet-300">
              {formatDuration(weekDuration)}
            </h2>

            <p className="mt-2 text-xs text-gray-500">
              {weekCount} {isFa ? "جلسه" : "sessions"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101a2c] p-5">
            <p className="text-sm text-gray-400">
              {isFa ? "میانگین هر جلسه" : "Average Session"}
            </p>

            <h2 className="mt-4 text-2xl font-bold">
              {formatDuration(averageDuration)}
            </h2>

            <p className="mt-2 text-xs text-gray-500">
              {isFa ? "بر اساس این هفته" : "Based on this week"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101a2c] p-5">
            <p className="text-sm text-gray-400">
              {isFa ? "مجموع کل مطالعه" : "All-Time Study"}
            </p>

            <h2 className="mt-4 text-2xl font-bold text-emerald-300">
              {formatDuration(totalDuration)}
            </h2>

            <p className="mt-2 text-xs text-gray-500">
              {totalCount} {isFa ? "جلسه ثبت‌شده" : "recorded sessions"}
            </p>
          </div>
        </section>

        {/* Weekly Chart */}
        <section className="mb-8 rounded-3xl border border-white/10 bg-[#101a2c] p-6 md:p-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                {isFa ? "گزارش هفتگی مطالعه" : "Weekly Study Report"}
              </h2>

              <p className="mt-2 text-xs text-gray-500">
                {isFa
                  ? "مقایسه زمان مطالعه در روزهای هفته"
                  : "Compare study time across the week"}
              </p>
            </div>

            <span className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-xs text-cyan-300">
              {isFa ? "هفته جاری" : "Current Week"}
            </span>
          </div>

          <div className="flex h-64 items-end justify-between gap-2 sm:gap-5">
            {weekDays.map((day) => {
              const height =
                day.duration > 0
                  ? Math.max(
                      (day.duration / weeklyMaximum) * 100,
                      5
                    )
                  : 2;

              return (
                <div
                  key={day.key}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                >
                  <span className="text-[10px] text-gray-400">
                    {day.duration > 0
                      ? formatDuration(day.duration)
                      : "—"}
                  </span>

                  <div className="flex h-full w-full items-end justify-center">
                    <div
                      className={`w-full max-w-12 rounded-t-xl transition-all duration-500 ${
                        day.duration > 0
                          ? "bg-gradient-to-t from-violet-600 to-cyan-400"
                          : "bg-white/5"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-400">
                      {day.name}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-600">
                      {day.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Weekly Insights */}
        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-6">
            <p className="text-sm text-gray-400">
              {isFa
                ? "پربازده‌ترین روز هفته"
                : "Most Productive Day"}
            </p>

            <h2 className="mt-4 text-2xl font-bold">
              {bestDay && bestDay.duration > 0
                ? bestDay.name
                : isFa
                ? "هنوز اطلاعاتی نیست"
                : "No data yet"}
            </h2>

            <p className="mt-2 text-sm text-violet-300">
              {bestDay && bestDay.duration > 0
                ? formatDuration(bestDay.duration)
                : isFa
                ? "با شروع مطالعه اینجا نمایش داده می‌شود."
                : "Start studying to see your best day."}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-6">
            <p className="text-sm text-gray-400">
              {isFa ? "استمرار این هفته" : "Weekly Consistency"}
            </p>

            <h2 className="mt-4 text-3xl font-bold text-cyan-300">
              {activeDays} / {elapsedDays}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              {isFa
                ? `${consistencyPercentage}٪ روزهای سپری‌شده با مطالعه`
                : `${consistencyPercentage}% of elapsed days with study`}
            </p>
          </div>
        </section>

        {/* NABZ Study Analyst */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#171d3b] via-[#121d35] to-[#102b3c]">
          <div className="border-b border-white/10 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs text-violet-300">
                  <span>✦</span>
                  NABZ INTELLIGENCE
                </div>

                <h2 className="text-2xl font-bold">
                  {isFa
                    ? "تحلیل‌گر هوشمند نبض"
                    : "NABZ Study Analyst"}
                </h2>

                <p className="mt-2 text-sm text-gray-400">
                  {isFa
                    ? "الگوهای مطالعه‌ات را بررسی کن و از عملکردت بینش بگیر."
                    : "Discover your study patterns and gain insights from your performance."}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-3xl">
                🧠
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {/* Weekly comparison */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-xl">📊</span>

                <h3 className="font-bold">
                  {isFa
                    ? "تحلیل روند مطالعه"
                    : "Study Trend Analysis"}
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">
                    {isFa ? "بازه فعلی" : "Current period"}
                  </p>

                  <p className="mt-2 text-xl font-bold text-cyan-300">
                    {formatDuration(weekDuration)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    {isFa
                      ? "بازه مشابه هفته قبل"
                      : "Equivalent previous period"}
                  </p>

                  <p className="mt-2 text-xl font-bold text-violet-300">
                    {formatDuration(previousWeekDuration)}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                {!hasPreviousData || previousWeekDuration === 0 ? (
                  <p className="text-sm text-gray-400">
                    {isFa
                      ? "برای مقایسه روند، هنوز اطلاعات کافی از هفته قبل وجود ندارد."
                      : "There isn't enough previous-week study time to compare trends yet."}
                  </p>
                ) : weeklyDifference > 0 ? (
                  <p className="text-sm text-emerald-300">
                    ↑{" "}
                    {isFa
                      ? `زمان مطالعه ${weeklyChangePercentage}% افزایش داشته است.`
                      : `Study time increased by ${weeklyChangePercentage}%.`}
                  </p>
                ) : weeklyDifference < 0 ? (
                  <p className="text-sm text-amber-300">
                    ↓{" "}
                    {isFa
                      ? `زمان مطالعه ${Math.abs(weeklyChangePercentage ?? 0)}٪ کاهش داشته است.`
                      : `Study time decreased by ${Math.abs(weeklyChangePercentage ?? 0)}%.`}
                  </p>
                ) : (
                  <p className="text-sm text-cyan-300">
                    {isFa
                      ? "زمان مطالعه نسبت به بازه مشابه هفته قبل ثابت مانده است."
                      : "Study time is unchanged compared with the equivalent previous period."}
                  </p>
                )}
              </div>
            </div>

            {/* General recommendations */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="text-xl">💡</span>

                <h3 className="font-bold">
                  {isFa
                    ? "بینش‌ها و پیشنهادهای نبض"
                    : "NABZ Insights & Recommendations"}
                </h3>
              </div>

              <div className="space-y-3">
                {recommendations.map((item, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 rounded-2xl border p-4 ${
                      item.type === "positive"
                        ? "border-emerald-400/15 bg-emerald-400/5"
                        : item.type === "warning"
                        ? "border-amber-400/15 bg-amber-400/5"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">
                      {item.icon}
                    </div>

                    <div>
                      <h4 className="font-semibold text-white">
                        {item.title}
                      </h4>

                      <p className="mt-1 text-sm leading-7 text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2 border-t border-white/10 pt-5 text-xs leading-6 text-gray-500">
              <span>ⓘ</span>

              <p>
                {isFa
                  ? "این تحلیل بر اساس داده‌های ثبت‌شده و محاسبات آماری انجام می‌شود و هنوز از مدل هوش مصنوعی واقعی استفاده نمی‌کند."
                  : "These insights are based on recorded data and statistical calculations. A real AI model is not connected yet."}
              </p>
            </div>
          </div>
        </section>

        {/* Subject Performance Analysis */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#151b35] to-[#101a2c]">
          <div className="border-b border-white/10 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs text-cyan-300">
                  <span>◈</span>
                  SUBJECT INTELLIGENCE
                </div>

                <h2 className="text-2xl font-bold">
                  {isFa
                    ? "تحلیل نقاط قوت و ضعف درسی"
                    : "Subject Strengths & Weaknesses"}
                </h2>

                <p className="mt-2 text-sm text-gray-400">
                  {isFa
                    ? "پیشرفت هدف‌ها، روند هفتگی و توزیع زمان مطالعه هر درس."
                    : "Track subject goals, weekly trends and study-time distribution."}
                </p>
              </div>

              <Link
                href={`/${locale}/subjects`}
                className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-2.5 text-sm text-cyan-300 transition hover:bg-cyan-400/10"
              >
                {isFa ? "مدیریت درس‌ها ↗" : "Manage Subjects ↗"}
              </Link>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {subjectStats.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
                <div className="mb-4 text-4xl">📚</div>

                <h3 className="font-semibold text-slate-300">
                  {isFa
                    ? "هنوز درسی اضافه نکردی."
                    : "No subjects added yet."}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {isFa
                    ? "برای شروع تحلیل عملکرد درسی، ابتدا درس‌هایت را ثبت کن."
                    : "Add your subjects to start analyzing your performance."}
                </p>

                <Link
                  href={`/${locale}/subjects`}
                  className="mt-5 inline-block text-sm text-cyan-400 hover:text-cyan-300"
                >
                  {isFa ? "افزودن اولین درس ↗" : "Add Your First Subject ↗"}
                </Link>
              </div>
            ) : (
              <>
                {/* Subject overview cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-5">
                    <p className="text-sm text-gray-400">
                      {isFa ? "بیشترین مطالعه در کل" : "Most Studied Overall"}
                    </p>

                    <h3 className="mt-3 truncate text-xl font-bold text-violet-300">
                      {topSubject?.name ??
                        (isFa ? "هنوز ثبت نشده" : "No data yet")}
                    </h3>

                    <p className="mt-2 text-xs text-gray-500">
                      {topSubject
                        ? formatDuration(topSubject.duration)
                        : isFa
                        ? "هنوز جلسه‌ای ثبت نشده."
                        : "No sessions recorded yet."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-5">
                    <p className="text-sm text-gray-400">
                      {isFa ? "بیشترین مطالعه این هفته" : "Most Studied This Week"}
                    </p>

                    <h3 className="mt-3 truncate text-xl font-bold text-cyan-300">
                      {weeklyTopSubject?.name ??
                        (isFa ? "هنوز ثبت نشده" : "No data yet")}
                    </h3>

                    <p className="mt-2 text-xs text-gray-500">
                      {weeklyTopSubject
                        ? formatDuration(weeklyTopSubject.currentDuration)
                        : isFa
                        ? "این هفته مطالعه‌ای ثبت نشده."
                        : "No study recorded this week."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-5">
                    <p className="text-sm text-gray-400">
                      {isFa ? "هدف‌های تکمیل‌شده" : "Completed Goals"}
                    </p>

                    <h3 className="mt-3 text-3xl font-bold text-emerald-300">
                      {completedSubjects.length} / {subjectStats.length}
                    </h3>

                    <p className="mt-2 text-xs text-gray-500">
                      {isFa
                        ? "بر اساس مجموع ساعت هدف هر درس"
                        : "Based on each subject's total-hour target"}
                    </p>
                  </div>
                </div>

                {/* Subject details */}
                <div className="mb-8">
                  <div className="mb-5">
                    <h3 className="text-lg font-bold">
                      {isFa ? "گزارش اختصاصی هر درس" : "Individual Subject Reports"}
                    </h3>

                    <p className="mt-2 text-xs text-gray-500">
                      {isFa
                        ? "درصد پیشرفت هدف و مقایسه عملکرد هفتگی هر درس."
                        : "Goal progress and weekly performance comparison for each subject."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {subjectStats.map((subject) => {
                      const share = getSubjectShare(subject.duration);

                      const status =
                        subject.targetSeconds > 0 &&
                        subject.duration >= subject.targetSeconds
                          ? "completed"
                          : subject.duration > 0
                          ? "progress"
                          : "empty";

                      return (
                        <article
                          key={subject.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-violet-400/20"
                        >
                          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h4 className="text-lg font-bold">
                                {subject.name}
                              </h4>

                              <p className="mt-1 text-xs text-gray-500">
                                {subject.count}{" "}
                                {isFa ? "جلسه ثبت‌شده" : "recorded sessions"}
                              </p>
                            </div>

                            <span
                              className={`rounded-lg px-3 py-1.5 text-xs ${
                                status === "completed"
                                  ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                  : status === "progress"
                                  ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                                  : "border border-amber-400/20 bg-amber-400/10 text-amber-300"
                              }`}
                            >
                              {status === "completed"
                                ? isFa
                                  ? "هدف تکمیل شده"
                                  : "Goal completed"
                                : status === "progress"
                                ? isFa
                                  ? "در حال پیشرفت"
                                  : "In progress"
                                : isFa
                                ? "بدون مطالعه"
                                : "No study yet"}
                            </span>
                          </div>

                          {/* Total goal progress */}
                          <div className="mb-5">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                              <span className="text-gray-400">
                                {isFa ? "پیشرفت هدف کل" : "Total Goal Progress"}
                              </span>

                              <span className="font-semibold text-cyan-300">
                                {subject.targetSeconds > 0
                                  ? `${Math.round(subject.progress)}%`
                                  : isFa
                                  ? "هدف نامعتبر"
                                  : "Invalid target"}
                              </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                                style={{
                                  width: `${subject.progress}%`,
                                }}
                              />
                            </div>

                            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-gray-500">
                              <span>
                                {isFa ? "مطالعه‌شده:" : "Studied:"}{" "}
                                {formatDuration(subject.duration)}
                              </span>

                              <span>
                                {isFa ? "هدف:" : "Target:"}{" "}
                                {subject.targetHours}h
                              </span>
                            </div>

                            {subject.targetSeconds > 0 &&
                              subject.remainingSeconds > 0 && (
                                <p className="mt-2 text-xs text-gray-500">
                                  {isFa
                                    ? `تا تکمیل هدف ${formatDuration(subject.remainingSeconds)} باقی مانده.`
                                    : `${formatDuration(subject.remainingSeconds)} remaining to reach the goal.`}
                                </p>
                              )}
                          </div>

                          {/* Weekly performance */}
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl bg-white/[0.035] p-3">
                              <p className="text-xs text-gray-500">
                                {isFa ? "این هفته" : "This Week"}
                              </p>

                              <p className="mt-2 font-semibold text-cyan-300">
                                {formatDuration(subject.currentDuration)}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white/[0.035] p-3">
                              <p className="text-xs text-gray-500">
                                {isFa ? "بازه مشابه هفته قبل" : "Previous Period"}
                              </p>

                              <p className="mt-2 font-semibold text-violet-300">
                                {formatDuration(subject.previousDuration)}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white/[0.035] p-3">
                              <p className="text-xs text-gray-500">
                                {isFa ? "تغییر هفتگی" : "Weekly Change"}
                              </p>

                              <p
                                className={`mt-2 font-semibold ${
                                  !subject.hasWeeklyComparison
                                    ? "text-gray-400"
                                    : subject.currentDuration > subject.previousDuration
                                    ? "text-emerald-300"
                                    : subject.currentDuration < subject.previousDuration
                                    ? "text-amber-300"
                                    : "text-cyan-300"
                                }`}
                              >
                                {!subject.hasWeeklyComparison
                                  ? isFa
                                    ? "داده کافی نیست"
                                    : "No baseline"
                                  : subject.weeklyChange === null
                                  ? subject.currentDuration > 0
                                    ? isFa
                                      ? "شروع فعالیت"
                                      : "Activity started"
                                    : "—"
                                  : subject.weeklyChange > 0
                                  ? `↑ ${subject.weeklyChange}%`
                                  : subject.weeklyChange < 0
                                  ? `↓ ${Math.abs(subject.weeklyChange)}%`
                                  : isFa
                                  ? "بدون تغییر"
                                  : "No change"}
                              </p>
                            </div>
                          </div>

                          {/* Distribution */}
                          <div className="mt-5 border-t border-white/5 pt-4">
                            <div className="mb-2 flex justify-between text-xs text-gray-500">
                              <span>
                                {isFa ? "سهم از کل زمان مطالعه" : "Share of Total Study Time"}
                              </span>

                              <span>{share}٪</span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                                style={{ width: `${share}%` }}
                              />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                {/* Subject balance insights */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-xl">⚖️</span>

                    <h3 className="font-bold">
                      {isFa
                        ? "تحلیل تعادل مطالعه"
                        : "Study Balance Analysis"}
                    </h3>
                  </div>

                  {studiedSubjects.length === 0 ? (
                    <p className="text-sm leading-7 text-gray-400">
                      {isFa
                        ? "برای تحلیل تعادل مطالعه، ابتدا باید برای درس‌هایت جلسه مطالعه ثبت کنی."
                        : "Record study sessions for your subjects to analyze your study balance."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {topSubject && getSubjectShare(topSubject.duration) >= 70 && studiedSubjects.length > 1 ? (
                        <div className="flex gap-3 rounded-xl border border-amber-400/15 bg-amber-400/5 p-4">
                          <span className="text-xl">💡</span>

                          <p className="text-sm leading-7 text-gray-300">
                            {isFa
                              ? `حدود ${getSubjectShare(topSubject.duration)}٪ از زمان مطالعه‌ات به درس «${topSubject.name}» اختصاص پیدا کرده. اگر درس‌های دیگر هم برایت اولویت دارند، می‌توانی زمان مطالعه را متعادل‌تر تقسیم کنی.`
                              : `About ${getSubjectShare(topSubject.duration)}% of your study time is dedicated to "${topSubject.name}". If other subjects are also priorities, consider balancing your study time.`}
                          </p>
                        </div>
                      ) : (
                        <div className="flex gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                          <span className="text-xl">🌱</span>

                          <p className="text-sm leading-7 text-gray-300">
                            {isFa
                              ? "زمان مطالعه بین درس‌های ثبت‌شده توزیع شده است. برای حفظ این روند، عملکرد هفتگی هر درس را بررسی کن."
                              : "Your recorded study time is distributed across your subjects. Keep reviewing each subject's weekly performance."}
                          </p>
                        </div>
                      )}

                      {subjectsWithoutStudyThisWeek.length > 0 && (
                        <div className="flex gap-3 rounded-xl border border-amber-400/15 bg-amber-400/5 p-4">
                          <span className="text-xl">📌</span>

                          <p className="text-sm leading-7 text-gray-300">
                            {isFa
                              ? `این هفته برای ${subjectsWithoutStudyThisWeek.map((subject) => subject.name).slice(0, 3).join("، ")} مطالعه‌ای ثبت نشده است. در صورت نیاز، زمانی برای این درس‌ها در برنامه‌ات قرار بده.`
                              : `No study has been recorded this week for ${subjectsWithoutStudyThisWeek.map((subject) => subject.name).slice(0, 3).join(", ")}. Consider scheduling time for them if needed.`}
                          </p>
                        </div>
                      )}

                      <p className="pt-2 text-xs leading-6 text-gray-500">
                        {isFa
                          ? "توجه: سهم زمانی هر درس به‌تنهایی نشان‌دهنده کیفیت یادگیری یا میزان تسلط تو نیست؛ این گزارش فقط زمان‌های ثبت‌شده را تحلیل می‌کند."
                          : "Note: Study-time share alone does not measure learning quality or mastery. This report analyzes recorded study time only."}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Existing Subject Analytics */}
        <section className="rounded-3xl border border-white/10 bg-[#101a2c] p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              {isFa ? "عملکرد بر اساس درس" : "Performance by Subject"}
            </h2>

            <p className="mt-2 text-xs text-gray-500">
              {isFa
                ? "میزان زمانی که برای هر درس صرف کرده‌ای."
                : "See how much time you have spent on each subject."}
            </p>
          </div>

          {subjectStats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center">
              <p className="text-sm text-gray-400">
                {isFa
                  ? "هنوز درسی ثبت نکرده‌ای."
                  : "You haven't added any subjects yet."}
              </p>

              <Link
                href={`/${locale}/subjects`}
                className="mt-4 inline-block text-sm text-cyan-400 hover:text-cyan-300"
              >
                {isFa ? "افزودن درس ↗" : "Add a Subject ↗"}
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {subjectStats.map((subject) => {
                const percentage =
                  totalDuration > 0
                    ? (subject.duration / totalDuration) * 100
                    : 0;

                return (
                  <div key={subject.id}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">
                          {subject.name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {subject.count} {isFa ? "جلسه" : "sessions"}
                        </p>
                      </div>

                      <span className="text-sm text-cyan-300">
                        {formatDuration(subject.duration)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-8 border-t border-white/10 py-6 text-center text-xs text-gray-600">
          NABZ — The Pulse of Learning
        </footer>
      </div>
    </main>
  );
}
