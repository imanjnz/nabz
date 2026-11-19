
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

const SUBJECTS_KEY = "nabz-subjects";
const SESSIONS_KEY = "nabz-study-sessions";

function BookIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 5.5C4 4.67 4.67 4 5.5 4H19v15H5.5A1.5 1.5 0 0 0 4 20.5v-15Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M4 17.5c0-.83.67-1.5 1.5-1.5H19M8 8h7M8 11h7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7v5l3.5 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TargetIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="12"
        r="5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path
        d="m13.5 10.5 6-6M16 4.5h3.5V8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LayersIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="m12 3 9 5-9 5-9-5 9-5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m3 12 9 5 9-5M3 16l9 5 9-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SubjectsPage() {
  const locale = useLocale();
  const isFa = locale === "fa";

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [name, setName] = useState("");
  const [targetHours, setTargetHours] = useState("10");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedSubjects = localStorage.getItem(SUBJECTS_KEY);
      const savedSessions = localStorage.getItem(SESSIONS_KEY);

      if (savedSubjects) {
        const parsed = JSON.parse(savedSubjects);
        if (Array.isArray(parsed)) setSubjects(parsed);
      }

      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed)) setSessions(parsed);
      }
    } catch {
      console.error("Could not load subjects.");
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
  }, [subjects, loaded]);

  const addSubject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    const hours = Number(targetHours);

    if (!cleanName || !Number.isFinite(hours) || hours <= 0) return;

    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name: cleanName,
      targetHours: hours,
      createdAt: new Date().toISOString(),
    };

    setSubjects((previous) => [...previous, newSubject]);
    setName("");
    setTargetHours("10");
  };

  const deleteSubject = (id: string) => {
    const confirmed = window.confirm(
      isFa
        ? "از حذف این درس مطمئنی؟"
        : "Are you sure you want to delete this subject?"
    );

    if (!confirmed) return;

    setSubjects((previous) => previous.filter((item) => item.id !== id));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
  };

  const getSubjectTime = (subjectId: string) => {
    return sessions
      .filter((session) => session.subjectId === subjectId)
      .reduce((total, session) => total + session.duration, 0);
  };

  const totalStudyTime = sessions.reduce(
    (total, session) => total + session.duration,
    0
  );

  const subjectsWithProgress = subjects.map((subject) => {
    const studiedSeconds = getSubjectTime(subject.id);
    const targetSeconds = subject.targetHours * 3600;

    const progress =
      targetSeconds > 0
        ? Math.min((studiedSeconds / targetSeconds) * 100, 100)
        : 0;

    return { ...subject, studiedSeconds, progress };
  });

  if (!loaded) return null;

  return (
    <main
      dir={isFa ? "rtl" : "ltr"}
      className="relative min-h-screen overflow-hidden bg-[#080d1c] px-4 py-8 text-white sm:px-8"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-violet-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute -right-40 top-[420px] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[130px]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
              NABZ / MY SUBJECTS
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {isFa ? "درس‌های من" : "My Subjects"}
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              {isFa
                ? "درس‌هایت را مدیریت کن و مسیر یادگیری‌ات را بساز."
                : "Manage your subjects and build your learning journey."}
            </p>
          </div>

          <Link
            href={`/${locale}/dashboard`}
            className="group inline-flex items-center gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-4 py-3 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              {isFa ? "←" : "→"}
            </span>
            {isFa ? "بازگشت به داشبورد" : "Back to Dashboard"}
          </Link>
        </header>

        {/* Overview */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="group relative overflow-hidden rounded-3xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.12] to-[#111a30] p-6 transition duration-300 hover:border-violet-400/50">
            <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-violet-500/20" />

            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">
                  {isFa ? "تعداد درس‌ها" : "Total Subjects"}
                </p>

                <h2 className="mt-3 text-3xl font-extrabold text-violet-300">
                  {subjects.length}
                </h2>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300 shadow-[0_0_30px_rgba(139,92,246,0.12)]">
                <BookIcon className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.12] to-[#111a30] p-6 transition duration-300 hover:border-cyan-400/50">
            <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl transition group-hover:bg-cyan-500/20" />

            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">
                  {isFa ? "مجموع زمان مطالعه" : "Total Study Time"}
                </p>

                <h2 className="mt-3 text-3xl font-extrabold text-cyan-300">
                  {formatTime(totalStudyTime)}
                </h2>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.12)]">
                <ClockIcon className="h-7 w-7" />
              </div>
            </div>
          </div>
        </section>

        {/* Add Subject */}
        <section className="relative mb-12 overflow-hidden rounded-[28px] border border-violet-400/20 bg-gradient-to-br from-[#172044] via-[#111a30] to-[#0c1830] p-6 shadow-[0_15px_60px_rgba(0,0,0,0.18)] sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/10 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-24 left-1/4 h-52 w-52 rounded-full bg-cyan-500/10 blur-[80px]" />

          <div className="relative">
            <div className="mb-7 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-2xl text-violet-300">
                  +
                </div>

                <h2 className="text-xl font-bold sm:text-2xl">
                  {isFa ? "افزودن درس جدید" : "Add New Subject"}
                </h2>
              </div>

              <div className="hidden text-5xl opacity-80 sm:block">
                📚
              </div>
            </div>

            <form
              onSubmit={addSubject}
              className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  {isFa ? "نام درس" : "Subject Name"}
                </label>

                <div className="relative">
                  <BookIcon className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-violet-300 ltr:left-4 rtl:right-4" />

                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={
                      isFa ? "نام درس، مثلاً ریاضی" : "e.g. Mathematics"
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#080d1c]/80 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10 ltr:pl-12 rtl:pr-12"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  {isFa ? "هدف مطالعه (ساعت)" : "Study Target (Hours)"}
                </label>

                <div className="relative">
                  <TargetIcon className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-300 ltr:left-4 rtl:right-4" />

                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={targetHours}
                    onChange={(event) => setTargetHours(event.target.value)}
                    placeholder={isFa ? "مثلاً ۱۰" : "e.g. 10"}
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#080d1c]/80 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10 ltr:pl-12 rtl:pr-12"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-7 py-4 font-bold text-white shadow-[0_8px_25px_rgba(124,58,237,0.2)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_10px_30px_rgba(34,211,238,0.2)] sm:min-w-[170px]"
                >
                  + {isFa ? "افزودن درس" : "Add Subject"}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Subjects List */}
        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
                <LayersIcon className="h-6 w-6" />
              </div>

              <h2 className="text-xl font-bold">
                {isFa ? "درس‌های ثبت‌شده" : "Your Subjects"}
              </h2>
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-400">
              {subjects.length} {isFa ? "درس" : "subjects"}
            </span>
          </div>

          {subjects.length === 0 ? (
            <div className="relative overflow-hidden rounded-[28px] border border-dashed border-violet-400/30 bg-gradient-to-br from-[#151d3b] via-[#111a30] to-[#101a35] px-6 py-14 text-center sm:py-16">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-[80px]" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px]" />

              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[28px] border border-violet-400/20 bg-gradient-to-br from-violet-500/20 to-cyan-500/10 text-5xl shadow-[0_0_45px_rgba(139,92,246,0.14)]">
                📚
              </div>

              <h3 className="relative text-lg font-bold text-slate-200">
                {isFa
                  ? "هنوز درسی اضافه نکردی!"
                  : "No subjects added yet!"}
              </h3>

              <p className="relative mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">
                {isFa
                  ? "اولین درس خودت رو اضافه کن و مسیر یادگیری‌ات رو در نبض بساز."
                  : "Add your first subject and start building your learning journey with NABZ."}
              </p>

              <button
                type="button"
                onClick={() =>
                  document
                    .querySelector<HTMLInputElement>(
                      'input[placeholder="نام درس، مثلاً ریاضی"]'
                    )
                    ?.focus()
                }
                className="relative mt-6 rounded-full border border-cyan-400/40 bg-cyan-400/[0.06] px-6 py-3 text-sm font-semibold text-cyan-300 transition hover:border-violet-400/60 hover:bg-violet-500/10 hover:text-violet-200"
              >
                + {isFa ? "افزودن اولین درس" : "Add Your First Subject"}
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {subjectsWithProgress.map((subject, index) => (
                <article
                  key={subject.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#17213c] to-[#10182d] p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_15px_40px_rgba(0,0,0,0.2)]"
                >
                  <div
                    className={`absolute top-0 h-1 w-full ${
                      index % 2 === 0
                        ? "bg-gradient-to-r from-violet-500 to-cyan-400"
                        : "bg-gradient-to-r from-cyan-400 to-blue-500"
                    }`}
                  />

                  <div className="mb-6 flex items-start justify-between gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                        index % 2 === 0
                          ? "border-violet-400/20 bg-violet-500/10 text-violet-300"
                          : "border-cyan-400/20 bg-cyan-500/10 text-cyan-300"
                      }`}
                    >
                      <BookIcon className="h-6 w-6" />
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteSubject(subject.id)}
                      className="rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-400/10"
                    >
                      {isFa ? "حذف درس" : "Delete"}
                    </button>
                  </div>

                  <h3 className="truncate text-xl font-bold text-white">
                    {subject.name}
                  </h3>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        {isFa ? "زمان مطالعه" : "Study Time"}
                      </p>
                      <p className="mt-1 font-semibold text-cyan-300">
                        {formatTime(subject.studiedSeconds)}
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-xs text-slate-500">
                        {isFa ? "هدف مطالعه" : "Study Target"}
                      </p>
                      <p className="mt-1 font-semibold text-violet-300">
                        {subject.targetHours}h
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {isFa ? "پیشرفت هدف" : "Goal Progress"}
                      </span>

                      <span className="font-bold text-white">
                        {Math.round(subject.progress)}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          index % 2 === 0
                            ? "bg-gradient-to-r from-violet-500 to-cyan-400"
                            : "bg-gradient-to-r from-cyan-400 to-blue-500"
                        }`}
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-xs text-slate-500">
                    <TargetIcon className="h-4 w-4 text-violet-300" />
                    {subject.progress >= 100
                      ? isFa
                        ? "هدف مطالعه تکمیل شده"
                        : "Study target completed"
                      : isFa
                        ? "در مسیر رسیدن به هدف"
                        : "Working toward your goal"}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-white/10 py-7 text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="hidden h-px w-12 bg-gradient-to-r from-transparent to-violet-500 sm:block" />

            <p className="text-xs tracking-wide text-slate-500">
              NABZ © 2026 — THE PULSE OF LEARNING
            </p>

            <div className="hidden h-px w-12 bg-gradient-to-l from-transparent to-cyan-400 sm:block" />
          </div>
        </footer>
      </div>
    </main>
  );
}
