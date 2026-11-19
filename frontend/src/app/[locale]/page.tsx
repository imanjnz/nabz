
import Link from "next/link";

type HomeProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const isFa = locale === "fa";
  const dashboardUrl = `/${locale}/dashboard`;

  const text = isFa
    ? {
        features: "امکانات",
        how: "چطور کار می‌کند",
        quiz: "آزمون‌ساز",
        login: "ورود به داشبورد",
        start: "شروع کن",
        viewFeatures: "دیدن امکانات",
        eyebrow: "THE PULSE OF LEARNING",
        title: <>نبضِ <em>یادگیری‌ات</em> را بشنو</>,
        description: "مطالعه‌ات را ثبت کن، کیفیتش را ببین، برنامه بریز و با آزمون هوشمند از جزوه‌ی خودت، خودت را بسنج.",
        weeklyScore: "امتیاز کیفیت این هفته",
        scoreStatus: "خوب و رو به بهتر",
        sample1: "ساختمان داده · تست",
        sample2: "ریاضی گسسته · تمرین",
        minutes: "۶۰ دقیقه",
        sample: "پیش‌نمایش با داده‌ی نمونه",
        featuresTitle: "هرچه برای درس‌خواندن منظم لازم داری",
        featuresSubtitle: "سه بخش که کنار هم کار می‌کنند: برنامه‌ریزی، تحلیل و آزمون.",
        feature1Title: "پلنر روزانه، هفتگی و ماهانه",
        feature1Description: "کارها را با تاریخ شمسی و میلادی بچین، با یک تیک انجام‌شده را ثبت کن و گزارش هفته‌ات را با نمودار ببین.",
        feature2Title: "تحلیل کیفیت و برنامه‌ریزی هوشمند",
        feature2Description: "امتیاز کیفیت از مدت، تمرکز، روش‌های فعال و پیوستگی محاسبه می‌شود و هوش مصنوعی بر پایه‌ی همین عددها برنامه پیشنهاد می‌دهد.",
        feature3Title: "آزمون‌ساز هوشمند",
        feature3Description: "جزوه‌ات را بارگذاری کن و آزمونی با تعداد سؤال، سطح، نوع و زمان دلخواه بگیر.",
        howTitle: "چطور کار می‌کند؟",
        howSubtitle: "چهار قدم ساده، هر روز.",
        step1: "ثبت کن",
        step1Description: "چه خواندی، چقدر، با چه روشی و با چه تمرکزی.",
        step2: "تحلیل ببین",
        step2Description: "امتیاز کیفیت و مباحثی که به توجه بیشتر نیاز دارند.",
        step3: "برنامه بریز",
        step3Description: "برنامه‌ای که روی مباحث ضعیف تو می‌نشیند.",
        step4: "خودت را بسنج",
        step4Description: "آزمون از جزوه‌ی خودت، با تنظیمات خودت.",
        quizTitle: "آزمون از جزوه‌ی خودت",
        quizDescription: "فایل جزوه را بارگذاری می‌کنی و آزمون را مطابق نیازت تنظیم می‌کنی. سؤال‌ها را مدل می‌سازد، پس پیش از اتکا به پاسخ‌ها آن‌ها را با جزوه تطبیق بده.",
        count: "تعداد سؤال",
        level: "سطح",
        type: "نوع سؤال",
        time: "زمان",
        easy: "آسان",
        medium: "متوسط",
        hard: "دشوار",
        multiple: "چهارگزینه‌ای",
        trueFalse: "درست یا نادرست",
        descriptive: "تشریحی",
        unlimited: "بدون محدودیت",
        ready: "آماده‌ای نبضت را بشنوی؟",
        readyDescription: "همین امروز اولین جلسه‌ی مطالعه‌ات را ثبت کن.",
        footerNote: "امتیاز کیفیت تقریبی و بر پایه‌ی داده‌ی خوداظهاری است.",
      }
    : {
        features: "Features",
        how: "How It Works",
        quiz: "Exam Generator",
        login: "Open Dashboard",
        start: "Get Started",
        viewFeatures: "Explore Features",
        eyebrow: "THE PULSE OF LEARNING",
        title: <>Feel the Pulse of <em>Your Learning</em></>,
        description: "Track your study sessions, understand your learning quality, plan your next steps, and test yourself with exams generated from your own notes.",
        weeklyScore: "This Week's Quality Score",
        scoreStatus: "Good and improving",
        sample1: "Data Structures · Practice",
        sample2: "Discrete Math · Exercises",
        minutes: "60 minutes",
        sample: "Preview with sample data",
        featuresTitle: "Everything You Need for Better Learning",
        featuresSubtitle: "Three connected pillars: planning, analysis, and assessment.",
        feature1Title: "Daily, Weekly & Monthly Planner",
        feature1Description: "Organize tasks with Persian and Gregorian dates, track completion, and review your weekly progress through charts.",
        feature2Title: "Study Quality & Smart Planning",
        feature2Description: "Study quality is calculated from duration, focus, active learning methods, and consistency. AI can use these metrics to suggest plans.",
        feature3Title: "Smart Exam Generator",
        feature3Description: "Upload your notes and generate exams with your preferred question count, difficulty, type, and time limit.",
        howTitle: "How Does It Work?",
        howSubtitle: "Four simple steps, every day.",
        step1: "Track",
        step1Description: "What you studied, for how long, and with what focus.",
        step2: "Understand",
        step2Description: "See your quality score and topics that need more attention.",
        step3: "Plan",
        step3Description: "Build a plan around the topics you need to improve.",
        step4: "Test Yourself",
        step4Description: "Take an exam generated from your own notes.",
        quizTitle: "Exams From Your Own Notes",
        quizDescription: "Upload your notes and customize your exam. Questions are generated by a model, so always verify answers against your source material.",
        count: "Question Count",
        level: "Difficulty",
        type: "Question Type",
        time: "Time Limit",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        multiple: "Multiple Choice",
        trueFalse: "True or False",
        descriptive: "Descriptive",
        unlimited: "Unlimited",
        ready: "Ready to Find Your Learning Pulse?",
        readyDescription: "Start by recording your first study session today.",
        footerNote: "Quality scores are estimates based on self-reported study data.",
      };

  const steps = [
    { title: text.step1, description: text.step1Description },
    { title: text.step2, description: text.step2Description },
    { title: text.step3, description: text.step3Description },
    { title: text.step4, description: text.step4Description },
  ];

  return (
    <main
      dir={isFa ? "rtl" : "ltr"}
      lang={locale}
      className="nabz-landing"
    >
      <header className="landing-header">
        <div className="landing-wrap landing-nav">
          <Link href={`/${locale}`} className="landing-logo" aria-label="NABZ">
            <svg width="34" height="34" viewBox="0 0 120 120" aria-hidden="true">
              <circle
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray="207 70"
                transform="rotate(-60 60 60)"
              />
              <polyline
                points="36,62 49,62 55,46 64,78 70,62 84,62"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>نبض</span>
          </Link>

          <nav className="landing-links" aria-label={isFa ? "بخش‌ها" : "Sections"}>
            <a href="#features">{text.features}</a>
            <a href="#how">{text.how}</a>
            <a href="#quiz">{text.quiz}</a>
          </nav>

          <Link href={dashboardUrl} className="landing-btn">
            {text.login}
          </Link>
        </div>
      </header>

      <section className="landing-hero" id="top">
        <div className="landing-wrap landing-hero-grid">
          <div className="landing-intro">
            <div className="landing-eyebrow">{text.eyebrow}</div>
            <h1>{text.title}</h1>
            <p className="landing-lead">{text.description}</p>

            <div className="landing-cta">
              <Link href={dashboardUrl} className="landing-btn">
                {text.start}
              </Link>
              <a href="#features" className="landing-btn landing-btn-outline">
                {text.viewFeatures}
              </a>
            </div>
          </div>

          <div
            className="landing-mock"
            role="img"
            aria-label={isFa ? "پیش‌نمایش نمونه داشبورد نبض" : "NABZ dashboard preview"}
          >
            <div className="landing-mock-row">
              <div className="landing-ring">
                <svg viewBox="0 0 112 112" width="112" height="112" aria-hidden="true">
                  <circle cx="56" cy="56" r="48" fill="none" stroke="#2A3560" strokeWidth="10" />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    fill="none"
                    stroke="#26D9D0"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="217 302"
                    transform="rotate(-90 56 56)"
                  />
                </svg>
                <b>{isFa ? "۷۲" : "72"}</b>
              </div>

              <div>
                <div className="landing-muted">{text.weeklyScore}</div>
                <div className="landing-score-status">{text.scoreStatus}</div>
              </div>
            </div>

            <svg viewBox="0 0 300 30" width="100%" height="30" aria-hidden="true">
              <polyline
                className="landing-pulse"
                points="0,15 90,15 104,4 120,26 134,15 300,15"
                fill="none"
                stroke="#26D9D0"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div className="landing-sample-row landing-yellow">
              <span>{text.sample1}</span>
              <span className="landing-muted">{text.minutes} ✓</span>
            </div>

            <div className="landing-sample-row landing-blue">
              <span>{text.sample2}</span>
              <span className="landing-muted">{text.minutes}</span>
            </div>

            <div className="landing-muted landing-center">{text.sample}</div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="landing-wrap">
          <h2>{text.featuresTitle}</h2>
          <p className="landing-subtitle">{text.featuresSubtitle}</p>

          <div className="landing-grid-3">
            <article className="landing-feature landing-cyan">
              <div className="landing-feature-icon">◷</div>
              <h3>{text.feature1Title}</h3>
              <p>{text.feature1Description}</p>
            </article>

            <article className="landing-feature landing-blue">
              <div className="landing-feature-icon">◈</div>
              <h3>{text.feature2Title}</h3>
              <p>{text.feature2Description}</p>
            </article>

            <article className="landing-feature landing-violet">
              <div className="landing-feature-icon">✧</div>
              <h3>{text.feature3Title}</h3>
              <p>{text.feature3Description}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-top" id="how">
        <div className="landing-wrap">
          <h2>{text.howTitle}</h2>
          <p className="landing-subtitle">{text.howSubtitle}</p>

          <div className="landing-grid-4">
            {steps.map((step, index) => (
              <article className="landing-step" key={step.title}>
                <div className="landing-step-number">
                  {isFa ? ["۱", "۲", "۳", "۴"][index] : index + 1}
                </div>
                <b>{step.title}</b>
                <span>{step.description}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-top" id="quiz">
        <div className="landing-wrap landing-quiz">
          <div>
            <h2>{text.quizTitle}</h2>
            <p className="landing-subtitle landing-quiz-description">
              {text.quizDescription}
            </p>
          </div>

          <div className="landing-mock landing-quiz-mock">
            <div>
              <div className="landing-muted">{text.count}</div>
              <div className="landing-chips">
                <span>{isFa ? "۱۰" : "10"}</span>
                <span className="landing-chip-active">{isFa ? "۲۰" : "20"}</span>
                <span>{isFa ? "۳۰" : "30"}</span>
              </div>
            </div>

            <div>
              <div className="landing-muted">{text.level}</div>
              <div className="landing-chips">
                <span>{text.easy}</span>
                <span className="landing-chip-active">{text.medium}</span>
                <span>{text.hard}</span>
              </div>
            </div>

            <div>
              <div className="landing-muted">{text.type}</div>
              <div className="landing-chips">
                <span className="landing-chip-active">{text.multiple}</span>
                <span>{text.trueFalse}</span>
                <span>{text.descriptive}</span>
              </div>
            </div>

            <div>
              <div className="landing-muted">{text.time}</div>
              <div className="landing-chips">
                <span>{isFa ? "۱۵ دقیقه" : "15 min"}</span>
                <span className="landing-chip-active">{isFa ? "۳۰ دقیقه" : "30 min"}</span>
                <span>{text.unlimited}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-top">
        <div className="landing-wrap">
          <div className="landing-band">
            <h2>{text.ready}</h2>
            <p>{text.readyDescription}</p>
            <Link href={dashboardUrl} className="landing-btn landing-band-btn">
              {text.login}
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-wrap landing-footer-content">
          <span>نبض · THE PULSE OF LEARNING</span>
          <span>{text.footerNote}</span>
        </div>
      </footer>

      <style>{`
        .nabz-landing {
          --ac: #26d9d0;
          --el: #248bff;
          --vi: #7048e8;
          --vl: #a78bfa;
          --bg: #101936;
          --cd: #1b2547;
          --bd: #2a3560;
          --tx: #e8ecf4;
          --mu: #a8b3d1;
          min-height: 100vh;
          background: var(--bg);
          color: var(--tx);
          font-family: var(--font-vazirmatn, Vazirmatn), Tahoma, Arial, sans-serif;
          line-height: 1.9;
        }

        .nabz-landing * { box-sizing: border-box; }
        .landing-wrap { width: 100%; max-width: 1160px; margin: 0 auto; padding: 0 20px; }

        .landing-header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(16,25,54,.88);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--bd);
        }

        .landing-nav { height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .landing-logo { display: flex; align-items: center; gap: 10px; color: var(--ac); font-size: 22px; font-weight: 800; text-decoration: none; }
        .landing-links { display: flex; align-items: center; gap: 24px; }
        .landing-links a { color: var(--mu); font-size: 15px; text-decoration: none; transition: color .2s; }
        .landing-links a:hover { color: var(--tx); }

        .landing-btn {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 46px; padding: 0 24px; border-radius: 12px;
          background: var(--ac); color: var(--bg); font-weight: 700;
          text-decoration: none; transition: transform .15s, filter .15s; white-space: nowrap;
        }
        .landing-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }
        .landing-btn-outline { background: transparent; color: var(--tx); border: 1px solid #3a4678; }

        .landing-hero {
          padding: 72px 0 64px;
          background:
            radial-gradient(800px 420px at 85% 0,rgba(112,72,232,.38),transparent 70%),
            radial-gradient(600px 400px at 8% 25%,rgba(38,217,208,.13),transparent 70%);
        }
        .landing-hero-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: 44px; align-items: center; }
        .landing-eyebrow { color: var(--vl); letter-spacing: .16em; font-size: 13px; font-weight: 600; direction: ltr; text-align: start; }
        .landing-intro h1 { font-size: clamp(32px,5vw,52px); line-height: 1.5; margin: 10px 0 16px; font-weight: 800; }
        .landing-intro h1 em { font-style: normal; color: var(--ac); }
        .landing-lead { color: var(--mu); font-size: 18px; max-width: 520px; margin: 0; line-height: 2.1; }
        .landing-cta { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }

        .landing-mock {
          background: var(--cd); border: 1px solid var(--bd); border-radius: 24px;
          padding: 24px; display: grid; gap: 16px;
          box-shadow: 0 30px 80px rgba(0,0,0,.35); min-width: 0;
        }
        .landing-mock-row { display: flex; align-items: center; gap: 20px; }
        .landing-ring { position: relative; width: 112px; height: 112px; flex: none; }
        .landing-ring b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 30px; }
        .landing-muted { color: var(--mu); font-size: 13px; }
        .landing-score-status { font-weight: 800; font-size: 20px; margin-top: 4px; }
        .landing-sample-row {
          display: flex; justify-content: space-between; align-items: center; gap: 12px;
          background: #222d55; border-radius: 12px; padding: 10px 14px;
          font-size: 14px; border-inline-start: 4px solid var(--sample-color);
        }
        .landing-yellow { --sample-color: #fbbf24; }
        .landing-blue { --sample-color: #248bff; }
        .landing-pulse { stroke-dasharray: 420; stroke-dashoffset: 420; animation: landing-pulse-animation 3.2s ease-out infinite; }
        @keyframes landing-pulse-animation { 60%,100% { stroke-dashoffset: 0; } }
        .landing-center { text-align: center; }

        .landing-section { padding: 76px 0; }
        .landing-section h2 { font-size: clamp(26px,3.5vw,36px); line-height: 1.5; margin: 0 0 10px; font-weight: 800; }
        .landing-subtitle { color: var(--mu); max-width: 620px; margin: 0 0 38px; line-height: 2; }
        .landing-grid-3 { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 18px; }
        .landing-feature { background: var(--cd); border: 1px solid var(--bd); border-top: 4px solid var(--feature-color); border-radius: 22px; padding: 26px; }
        .landing-cyan { --feature-color: #26d9d0; }
        .landing-blue { --feature-color: #248bff; }
        .landing-violet { --feature-color: #7048e8; }
        .landing-feature-icon { color: var(--feature-color); font-size: 25px; margin-bottom: 12px; }
        .landing-feature h3 { margin: 0 0 8px; font-size: 18px; font-weight: 800; }
        .landing-feature p { margin: 0; color: var(--mu); font-size: 14px; line-height: 2.1; }

        .landing-section-top { padding-top: 0; }
        .landing-grid-4 { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 16px; }
        .landing-step { background: var(--cd); border: 1px solid var(--bd); border-radius: 20px; padding: 22px; }
        .landing-step-number { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: var(--vi); color: white; font-weight: 800; margin-bottom: 12px; }
        .landing-step b { display: block; margin-bottom: 4px; }
        .landing-step span { color: var(--mu); font-size: 14px; line-height: 2; }

        .landing-quiz { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
        .landing-quiz-description { margin-bottom: 0; }
        .landing-quiz-mock { gap: 20px; }
        .landing-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
        .landing-chips span { padding: 6px 14px; border-radius: 99px; background: #222d55; font-size: 13px; color: var(--mu); }
        .landing-chips .landing-chip-active { background: var(--vi); color: #fff; }

        .landing-band { background: linear-gradient(135deg,var(--vi),var(--el)); border-radius: 28px; padding: 48px 28px; text-align: center; }
        .landing-band h2 { margin: 0 0 8px; }
        .landing-band p { margin: 0 0 24px; color: #eef1ff; }
        .landing-band .landing-band-btn { background: #fff; color: #101936; }

        .landing-footer { border-top: 1px solid var(--bd); padding: 32px 0; color: var(--mu); font-size: 13px; }
        .landing-footer-content { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .nabz-landing a:focus-visible { outline: 3px solid var(--vl); outline-offset: 3px; border-radius: 10px; }

        @media (max-width:820px) {
          .landing-hero-grid,.landing-quiz { grid-template-columns: 1fr; }
          .landing-links { display: none; }
          .landing-hero { padding-top: 44px; }
          .landing-grid-3 { grid-template-columns: 1fr; }
          .landing-grid-4 { grid-template-columns: repeat(2,minmax(0,1fr)); }
        }

        @media (max-width:480px) {
          .landing-wrap { padding-left: 16px; padding-right: 16px; }
          .landing-nav { height: 64px; }
          .landing-logo { font-size: 19px; }
          .landing-nav > .landing-btn { padding: 0 13px; font-size: 12px; }
          .landing-grid-4 { grid-template-columns: 1fr; }
          .landing-mock { padding: 18px; }
          .landing-mock-row { gap: 12px; }
          .landing-ring,.landing-ring svg { width: 90px; height: 90px; }
          .landing-sample-row { font-size: 12px; padding: 10px; }
          .landing-section { padding-top: 55px; padding-bottom: 55px; }
          .landing-section-top { padding-top: 0; }
          .landing-band { padding: 36px 18px; }
        }

        @media (prefers-reduced-motion:reduce) {
          .landing-pulse { animation: none; stroke-dashoffset: 0; }
          .landing-btn { transition: none; }
        }
      `}</style>
    </main>
  );
}
