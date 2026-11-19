
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
  startedAt?: string;
  subjectId?: string;
};

const SESSIONS_KEY = "nabz-study-sessions";
const SUBJECTS_KEY = "nabz-subjects";

export default function StudyPage() {
  const locale = useLocale();
  const isFa = locale === "fa";

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [activeSubjectId, setActiveSubjectId] = useState("");

  // New: actual start time of the current session
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);

  const [loaded, setLoaded] = useState(false);

  // Load subjects and previous sessions
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

          if (parsed.length > 0) {
            setSelectedSubjectId(parsed[0].id);
          }
        }
      }
    } catch {
      console.error("Could not load study data.");
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
      console.error("Could not save study sessions.");
    }
  }, [sessions, loaded]);

  // Timer
  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setInterval(() => {
      setSeconds((previous) => previous + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning]);

  // Format time
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return [hours, minutes, secs]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  // Total study time
  const totalSeconds = sessions.reduce(
    (total, session) => total + session.duration,
    0
  );

  // Selected subject
  const selectedSubject = subjects.find(
    (subject) => subject.id === selectedSubjectId
  );

  // Subject currently attached to the timer
  const activeSubject = subjects.find(
    (subject) => subject.id === activeSubjectId
  );

  // Current subject study time
  const selectedSubjectSeconds = sessions
    .filter((session) => session.subjectId === selectedSubjectId)
    .reduce((total, session) => total + session.duration, 0);

  // Start or pause timer
  const handleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      return;
    }

    // Resume an existing session without changing its start time
    if (seconds > 0) {
      setIsRunning(true);
      return;
    }

    // A new session requires a selected subject
    if (!selectedSubjectId) return;

    setActiveSubjectId(selectedSubjectId);

    // Record the actual start time of a new session
    setSessionStartedAt(new Date().toISOString());

    setIsRunning(true);
  };

  // Finish session
  const finishSession = () => {
    if (seconds === 0 || !activeSubjectId) return;

    const newSession: StudySession = {
      id: crypto.randomUUID(),
      duration: seconds,
      date: new Date().toISOString(),
      startedAt: sessionStartedAt || new Date().toISOString(),
      subjectId: activeSubjectId,
    };

    setSessions((previous) => [newSession, ...previous]);

    setSeconds(0);
    setIsRunning(false);
    setActiveSubjectId("");
    setSessionStartedAt(null);
  };

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
    setActiveSubjectId("");
    setSessionStartedAt(null);
  };

  const displayedSubject =
    activeSubject || selectedSubject;

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
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-cyan-400">
              NABZ / STUDY SPACE
            </p>

            <h1 className="text-3xl font-bold sm:text-4xl">
              {isFa ? "جلسه مطالعه" : "Study Session"}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {isFa
                ? "تمرکز کن، یاد بگیر و پیشرفتت رو ثبت کن."
                : "Focus, learn, and track your progress."}
            </p>
          </div>

          <Link
            href={`/${locale}`}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm transition hover:bg-white/10"
          >
            {isFa ? "بازگشت به داشبورد" : "Back to Dashboard"}
          </Link>
        </header>

        {/* Subject Selection */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-[#111a30] p-6">
          <h2 className="mb-4 text-lg font-bold">
            {isFa ? "انتخاب درس" : "Select Subject"}
          </h2>

          {subjects.length === 0 ? (
            <div>
              <p className="mb-4 text-sm text-amber-300">
                {isFa
                  ? "هنوز درسی ثبت نکردی. برای شروع مطالعه ابتدا یک درس اضافه کن."
                  : "You haven't added any subjects yet. Add a subject before studying."}
              </p>

              <Link
                href={`/${locale}/subjects`}
                className="inline-flex rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-bold transition hover:brightness-110"
              >
                {isFa ? "رفتن به درس‌های من" : "Go to My Subjects"}
              </Link>
            </div>
          ) : (
            <>
              <select
                value={selectedSubjectId}
                onChange={(event) =>
                  setSelectedSubjectId(event.target.value)
                }
                disabled={seconds > 0 || isRunning}
                className="w-full rounded-xl border border-white/10 bg-[#080d1c] px-4 py-4 text-white outline-none transition focus:border-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="" disabled>
                  {isFa ? "یک درس انتخاب کن" : "Choose a subject"}
                </option>

                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>

              {displayedSubject && (
                <div className="mt-4 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
                  <p className="text-xs text-slate-400">
                    {isFa ? "درس جلسه فعلی" : "Current session subject"}
                  </p>

                  <p className="mt-1 font-semibold text-cyan-300">
                    {displayedSubject.name}
                  </p>
                </div>
              )}

              {seconds > 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  {isFa
                    ? "برای تغییر درس، ابتدا جلسه فعلی را پایان بده یا بازنشانی کن."
                    : "Finish or reset the current session before changing its subject."}
                </p>
              )}
            </>
          )}
        </section>

        {/* Timer */}
        <section className="overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#171d3b] via-[#142747] to-[#102b3c] p-6 shadow-2xl sm:p-12">
          <div className="text-center">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              {isFa ? "حالت تمرکز" : "Focus Mode"}
            </div>

            <h2 className="text-xl font-semibold text-slate-200">
              {isFa ? "زمان مطالعه فعلی" : "Current Study Time"}
            </h2>

            <div className="my-8 font-mono text-5xl font-bold tracking-wider text-white sm:text-7xl">
              {formatTime(seconds)}
            </div>

            <p className="mb-8 text-sm text-slate-400">
              {isRunning
                ? isFa
                  ? "در حال ثبت زمان مطالعه..."
                  : "Your study time is being recorded..."
                : seconds > 0
                ? isFa
                  ? "جلسه متوقف شده؛ می‌تونی ادامه بدی."
                  : "Session paused. You can resume."
                : isFa
                ? "برای شروع، درس موردنظرت رو انتخاب کن."
                : "Select a subject to begin."}
            </p>

            <div className="flex flex-wrap justify-center gap-3">

              <button
                onClick={handleTimer}
                disabled={!selectedSubjectId && seconds === 0}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-4 font-bold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isRunning
                  ? isFa
                    ? "توقف موقت"
                    : "Pause"
                  : seconds > 0
                  ? isFa
                    ? "ادامه مطالعه"
                    : "Resume"
                  : isFa
                  ? "شروع مطالعه"
                  : "Start Studying"}
              </button>

              <button
                onClick={finishSession}
                disabled={seconds === 0 || !activeSubjectId}
                className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 px-8 py-4 font-semibold text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {isFa ? "پایان جلسه" : "Finish Session"}
              </button>

              <button
                onClick={resetTimer}
                disabled={seconds === 0 && !isRunning}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {isFa ? "شروع مجدد" : "Reset"}
              </button>

            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="mt-10">
          <h2 className="mb-5 text-xl font-bold">
            {isFa ? "آمار مطالعه" : "Study Statistics"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-white/10 bg-[#111a30] p-6">
              <div className="mb-3 text-sm text-slate-400">
                {isFa ? "مجموع زمان مطالعه" : "Total Study Time"}
              </div>

              <div className="text-2xl font-bold text-cyan-300">
                {formatTime(totalSeconds)}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111a30] p-6">
              <div className="mb-3 text-sm text-slate-400">
                {isFa ? "جلسات تکمیل‌شده" : "Completed Sessions"}
              </div>

              <div className="text-2xl font-bold text-violet-300">
                {sessions.length}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111a30] p-6">
              <div className="mb-3 text-sm text-slate-400">
                {isFa ? "زمان مطالعه این درس" : "Selected Subject Time"}
              </div>

              <div className="text-2xl font-bold text-emerald-300">
                {formatTime(selectedSubjectSeconds)}
              </div>

              <p className="mt-2 truncate text-xs text-slate-500">
                {selectedSubject?.name ||
                  (isFa ? "درسی انتخاب نشده" : "No subject selected")}
              </p>
            </div>

          </div>
        </section>

        {/* Session History */}
        <section className="mt-10">

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {isFa ? "تاریخچه جلسات" : "Session History"}
            </h2>

            <span className="text-sm text-slate-400">
              {sessions.length} {isFa ? "جلسه" : "sessions"}
            </span>
          </div>

          <div className="space-y-3">

            {sessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-[#111a30] p-10 text-center">
                <div className="mb-3 text-4xl">📚</div>

                <p className="font-semibold text-slate-300">
                  {isFa
                    ? "هنوز جلسه‌ای ثبت نکردی."
                    : "No study sessions yet."}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {isFa
                    ? "اولین جلسه مطالعه‌ات رو شروع کن!"
                    : "Start your first study session!"}
                </p>
              </div>
            ) : (
              sessions.map((session) => {
                const subject = subjects.find(
                  (item) => item.id === session.subjectId
                );

                return (
                  <div
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111a30] p-5"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {subject
                          ? subject.name
                          : isFa
                          ? "بدون درس"
                          : "No subject"}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(session.date).toLocaleString(
                          isFa ? "fa-IR" : "en-US"
                        )}
                      </div>
                    </div>

                    <div className="font-mono text-lg font-bold text-cyan-300">
                      {formatTime(session.duration)}
                    </div>
                  </div>
                );
              })
            )}

          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-white/10 py-6 text-center text-xs tracking-wider text-slate-500">
          NABZ © 2026 — THE PULSE OF LEARNING
        </footer>

      </div>
    </main>
  );
}
