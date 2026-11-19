
"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface ExamQuestion {
  id: string;
  type: "multiple" | "truefalse" | "descriptive";
  question: string;
  options: string[] | null;
  difficulty: "easy" | "medium" | "hard";
}

interface ExamResponse {
  exam_id: string;
  title: string;
  total_questions: number;
  duration: number;
  questions: ExamQuestion[];
}

interface DescriptiveEvaluation {
  score: number;
  max_score: number;
  strengths: string[];
  missing_points: string[];
  feedback: string;
  suggested_answer: string;
  status: "evaluated" | "manual_review";
}

interface QuestionResult {
  question_id: string;
  question: string;
  question_type: string;
  user_answer: string | null;
  correct_answer: string | null;
  is_correct: boolean | null;
  explanation: string | null;
  status: string;
  evaluation?: DescriptiveEvaluation | null;
}

interface ExamResult {
  exam_id: string;
  total_questions: number;
  objective_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_questions: number;
  descriptive_questions: number;
  evaluated_descriptive_questions: number;
  manual_review_descriptive_questions: number;
  descriptive_score: number;
  descriptive_max_score: number;
  score: number;
  results: QuestionResult[];
}

export default function ExamsPage() {
  const locale = useLocale();
  const isFa = locale === "fa";

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");

  const [questionCount, setQuestionCount] = useState("10");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionType, setQuestionType] = useState("multiple");
  const [duration, setDuration] = useState("20");

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [extractedText, setExtractedText] = useState("");
  const [extractionMethod, setExtractionMethod] = useState("");

  const [exam, setExam] = useState<ExamResponse | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});

  const [descriptiveAnswers, setDescriptiveAnswers] = useState<
    Record<string, string>
  >({});

  const [error, setError] = useState("");

  const handleFileChange = (selectedFile?: File) => {
    if (!selectedFile) return;

    const allowed = [".pdf", ".docx", ".txt"];
    const extension = selectedFile.name
      .slice(selectedFile.name.lastIndexOf("."))
      .toLowerCase();

    if (!allowed.includes(extension)) {
      setError(
        isFa
          ? "فقط فایل PDF، Word و TXT مجاز است."
          : "Only PDF, Word and TXT files are supported."
      );
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setExtractedText("");
    setExtractionMethod("");
    setExam(null);
    setResult(null);
    setSelectedAnswers({});
    setDescriptiveAnswers({});
    setError("");
  };

  const handleExtract = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setExtractedText("");
    setExam(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE_URL}/api/exams/extract`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Text extraction failed.");
      }

      setExtractedText(data.text || "");
      setExtractionMethod(data.extraction_method || "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isFa
            ? "ارتباط با سرور برقرار نشد."
            : "Could not connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExam = async () => {
    if (extractedText.trim().length < 20) {
      setError(
        isFa
          ? "متن جزوه باید حداقل ۲۰ کاراکتر داشته باشد."
          : "Notes must contain at least 20 characters."
      );
      return;
    }

    setGenerating(true);
    setError("");
    setExam(null);
    setResult(null);
    setSelectedAnswers({});
    setDescriptiveAnswers({});

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/exams/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_text: extractedText,
            question_count: Number(questionCount),
            difficulty,
            question_type: questionType,
            duration: Number(duration),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Exam generation failed.");
      }

      setExam(data);

      setTimeout(() => {
        document
          .getElementById("generated-exam")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isFa
            ? "ارتباط با سرور برقرار نشد."
            : "Could not connect to the server."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectAnswer = (
    questionId: string,
    answer: string
  ) => {
    if (result) return;

    setSelectedAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));
  };

  const handleSubmitExam = async () => {
    if (!exam) return;

    const objectiveQuestions = exam.questions.filter(
      (question) => question.type !== "descriptive"
    );

    const unanswered = objectiveQuestions.filter(
      (question) => !selectedAnswers[question.id]
    );

    if (unanswered.length > 0) {
      setError(
        isFa
          ? `هنوز به ${unanswered.length} سؤال چهارگزینه‌ای یا درست و غلط پاسخ نداده‌ای.`
          : `You have ${unanswered.length} unanswered objective questions.`
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const answers = {
        ...selectedAnswers,
        ...descriptiveAnswers,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/exams/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            exam_id: exam.exam_id,
            answers,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Exam submission failed.");
      }

      setResult(data);

      setTimeout(() => {
        document
          .getElementById("exam-result")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isFa
            ? "ثبت پاسخ‌ها با خطا مواجه شد."
            : "Could not submit your answers."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cardStyle = {
    background: "linear-gradient(145deg, rgba(19, 27, 51, 0.96), rgba(12, 18, 36, 0.96))",
    border: "1px solid rgba(139, 92, 246, 0.24)",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 18px 50px rgba(0, 0, 0, 0.18)",
  };

  const inputStyle = {
    width: "100%",
    background: "#0a1122",
    border: "1px solid #344366",
    borderRadius: "12px",
    padding: "13px 14px",
    color: "white",
    outline: "none",
    transition: "border-color 160ms ease, box-shadow 160ms ease",
  };

  const primaryButtonStyle = {
    width: "100%",
    marginTop: "20px",
    padding: "15px 20px",
    borderRadius: "13px",
    border: "1px solid rgba(196, 181, 253, 0.25)",
    background: "linear-gradient(105deg, #6d3ce8, #2563eb 58%, #0891b2)",
    color: "white",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  };

  const getDifficultyLabel = (value: string) => {
    if (isFa) {
      if (value === "easy") return "آسان";
      if (value === "medium") return "متوسط";
      return "سخت";
    }

    if (value === "easy") return "Easy";
    if (value === "medium") return "Medium";
    return "Hard";
  };

  const getQuestionTypeLabel = (value: string) => {
    if (isFa) {
      if (value === "multiple") return "چهارگزینه‌ای";
      if (value === "truefalse") return "درست یا غلط";
      return "تشریحی";
    }

    if (value === "multiple") return "Multiple Choice";
    if (value === "truefalse") return "True / False";
    return "Descriptive";
  };

  const getResultStatus = (status: string) => {
    if (status === "correct") {
      return isFa ? "پاسخ صحیح" : "Correct";
    }

    if (status === "incorrect") {
      return isFa ? "پاسخ اشتباه" : "Incorrect";
    }

    if (status === "unanswered") {
      return isFa ? "بدون پاسخ" : "Unanswered";
    }

    if (status === "manual_review") {
      return isFa ? "نیازمند بررسی دستی" : "Manual review";
    }

    return status;
  };

  const getEvaluationStatus = (
    status: "evaluated" | "manual_review"
  ) => {
    if (status === "evaluated") {
      return isFa ? "ارزیابی انجام شد" : "Evaluation completed";
    }

    return isFa ? "در انتظار بررسی دستی" : "Waiting for manual review";
  };

  return (
    <main
      dir={isFa ? "rtl" : "ltr"}
      className="exam-studio-page"
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 82% 0%, rgba(91, 33, 182, 0.18), transparent 38%), #070b18",
        color: "#f8fafc",
        padding: "36px 28px 64px",
        fontFamily: "inherit",
      }}
    >
      <div className="exam-studio-content" style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <header className="exam-studio-header" style={{ marginBottom: "28px" }}>
          <div
            style={{
              color: "#a78bfa",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "2px",
              marginBottom: "12px",
            }}
          >
            NABZ INTELLIGENCE
          </div>

          <h1 style={{ fontSize: "32px", fontWeight: 800 }}>
            {isFa ? "آزمون‌ساز هوشمند" : "AI Exam Generator"}
          </h1>

          <p style={{ color: "#94a3b8", marginTop: "12px" }}>
            {isFa
              ? "از جزوه‌هایت آزمون بساز، دانش خودت را بسنج و نقاط ضعفت را پیدا کن."
              : "Generate exams from your notes, test your knowledge and discover your weak points."}
          </p>
        </header>

        <section className="exam-studio-intro">
          <div className="exam-studio-intro-copy">
            <span className="exam-studio-eyebrow">{isFa ? "فضای اختصاصی طراحی آزمون" : "YOUR PERSONAL EXAM WORKSPACE"}</span>
            <h2>{isFa ? "دانسته‌هایت را به چالش بکش." : "Turn your notes into a challenge."}</h2>
            <p>{isFa ? "جزوه را وارد کن، آزمونت را تنظیم کن و بعد از پاسخ‌گویی، عملکردت را بررسی کن." : "Add your study material, customize the exam, then review your performance."}</p>
          </div>
          <div className="exam-studio-steps">
            <div><span>01</span><strong>{isFa ? "بارگذاری منبع" : "Add source"}</strong></div>
            <div><span>02</span><strong>{isFa ? "تنظیم آزمون" : "Configure"}</strong></div>
            <div><span>03</span><strong>{isFa ? "تحلیل نتیجه" : "Review results"}</strong></div>
          </div>
        </section>

        <div
          className="exam-studio-form-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          <section style={cardStyle}>
            <h2 style={{ fontSize: "19px", marginBottom: "18px" }}>
              {isFa ? "۱. بارگذاری جزوه" : "1. Upload Notes"}
            </h2>

            <label
              htmlFor="notes-upload"
              style={{
                display: "flex",
                minHeight: "190px",
                border: "2px dashed #475569",
                borderRadius: "14px",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                cursor: "pointer",
                padding: "20px",
                textAlign: "center",
                background: "#0b1220",
              }}
            >
              <span style={{ fontSize: "38px", marginBottom: "12px" }}>
                📚
              </span>

              <strong>
                {isFa ? "برای انتخاب جزوه کلیک کن" : "Choose your notes"}
              </strong>

              <span
                style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  marginTop: "10px",
                }}
              >
                PDF · DOCX · TXT
              </span>

              <input
                id="notes-upload"
                type="file"
                accept=".pdf,.docx,.txt"
                hidden
                onChange={(event) =>
                  handleFileChange(event.target.files?.[0])
                }
              />
            </label>

            {fileName && (
              <p style={{ color: "#34d399", marginTop: "14px" }}>
                ✓ {fileName}
              </p>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ fontSize: "19px", marginBottom: "20px" }}>
              {isFa ? "۲. تنظیمات آزمون" : "2. Exam Settings"}
            </h2>

            <label style={{ display: "block", marginBottom: "10px" }}>
              {isFa ? "تعداد سؤالات" : "Number of Questions"}
            </label>

            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
              style={inputStyle}
            >
              {["5", "10", "15", "20", "30"].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>

            <label style={{ display: "block", margin: "20px 0 10px" }}>
              {isFa ? "سطح دشواری" : "Difficulty"}
            </label>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={inputStyle}
            >
              <option value="easy">{isFa ? "آسان" : "Easy"}</option>
              <option value="medium">{isFa ? "متوسط" : "Medium"}</option>
              <option value="hard">{isFa ? "سخت" : "Hard"}</option>
              <option value="mixed">{isFa ? "ترکیبی" : "Mixed"}</option>
            </select>

            <label style={{ display: "block", margin: "20px 0 10px" }}>
              {isFa ? "نوع سؤالات" : "Question Type"}
            </label>

            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              style={inputStyle}
            >
              <option value="multiple">{isFa ? "چهارگزینه‌ای" : "Multiple Choice"}</option>
              <option value="truefalse">{isFa ? "درست یا غلط" : "True / False"}</option>
              <option value="descriptive">{isFa ? "تشریحی" : "Descriptive"}</option>
              <option value="mixed">{isFa ? "ترکیبی" : "Mixed"}</option>
            </select>

            <label style={{ display: "block", margin: "20px 0 10px" }}>
              {isFa ? "زمان آزمون (دقیقه)" : "Exam Duration (Minutes)"}
            </label>

            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={inputStyle}
            >
              {["10", "20", "30", "45", "60", "0"].map((value) => (
                <option key={value} value={value}>
                  {value === "0"
                    ? isFa ? "بدون محدودیت" : "Unlimited"
                    : value}
                </option>
              ))}
            </select>
          </section>
        </div>

        <section style={{ ...cardStyle, marginTop: "20px" }}>
          <h2 style={{ fontSize: "19px", marginBottom: "14px" }}>
            {isFa ? "۳. استخراج محتوای جزوه" : "3. Extract Notes"}
          </h2>

          <p style={{ color: "#94a3b8", lineHeight: 2 }}>
            {isFa
              ? "فایل به سرور ارسال می‌شود و متن قابل استخراج آن برای بررسی نمایش داده خواهد شد."
              : "Your file will be sent to the server and its extractable text will be displayed for review."}
          </p>

          <button
            disabled={!file || loading || generating}
            onClick={handleExtract}
            style={{
              ...primaryButtonStyle,
              background: file && !loading && !generating
                ? "linear-gradient(90deg, #7c3aed, #0891b2)"
                : "#334155",
              cursor: file && !loading && !generating
                ? "pointer"
                : "not-allowed",
            }}
          >
            {loading
              ? isFa ? "در حال استخراج متن..." : "Extracting..."
              : isFa ? "استخراج متن جزوه" : "Extract Notes"}
          </button>

          {error && (
            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                borderRadius: "10px",
                background: "#451a1a",
                color: "#fca5a5",
                lineHeight: 1.8,
              }}
            >
              {error}
            </div>
          )}

          {extractedText && (
            <div style={{ marginTop: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <strong>{isFa ? "متن استخراج‌شده" : "Extracted Text"}</strong>

                <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                  {extractedText.length.toLocaleString()}{" "}
                  {isFa ? "کاراکتر" : "characters"}
                  {" · "}
                  {extractionMethod}
                </span>
              </div>

              <textarea
                value={extractedText}
                onChange={(e) => {
                  setExtractedText(e.target.value);
                  setExam(null);
                  setResult(null);
                }}
                rows={16}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  lineHeight: 2,
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
              />

              <button
                disabled={generating || loading || extractedText.trim().length < 20}
                onClick={handleGenerateExam}
                style={{
                  ...primaryButtonStyle,
                  background: !generating && !loading && extractedText.trim().length >= 20
                    ? "linear-gradient(90deg, #7c3aed, #0891b2)"
                    : "#334155",
                  cursor: !generating && !loading && extractedText.trim().length >= 20
                    ? "pointer"
                    : "not-allowed",
                }}
              >
                {generating
                  ? isFa ? "در حال ساخت آزمون..." : "Generating Exam..."
                  : isFa ? "ساخت آزمون با نبض" : "Generate Exam with NABZ"}
              </button>
            </div>
          )}
        </section>

        {exam && (
          <section
            id="generated-exam"
            style={{ ...cardStyle, marginTop: "24px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div>
                <div style={{ color: "#a78bfa", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                  NABZ EXAM
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: 800 }}>
                  {exam.title}
                </h2>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ background: "#1e293b", padding: "9px 13px", borderRadius: "9px", fontSize: "13px" }}>
                  📝 {exam.total_questions} {isFa ? "سؤال" : "Questions"}
                </span>
                <span style={{ background: "#1e293b", padding: "9px 13px", borderRadius: "9px", fontSize: "13px" }}>
                  ⏱️ {exam.duration === 0
                    ? isFa ? "بدون محدودیت" : "Unlimited"
                    : `${exam.duration} ${isFa ? "دقیقه" : "min"}`}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {exam.questions.map((question, index) => {
                const selected = selectedAnswers[question.id];

                const questionResult = result?.results.find(
                  (item) => item.question_id === question.id
                );

                const evaluation = questionResult?.evaluation;

                return (
                  <article
                    key={question.id}
                    style={{
                      background: "#0b1220",
                      border: "1px solid #263244",
                      borderRadius: "14px",
                      padding: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "10px",
                        marginBottom: "16px",
                      }}
                    >
                      <strong style={{ color: "#a78bfa" }}>
                        {isFa ? `سؤال ${index + 1}` : `Question ${index + 1}`}
                      </strong>

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ background: "#1e293b", color: "#cbd5e1", padding: "5px 9px", borderRadius: "7px", fontSize: "12px" }}>
                          {getQuestionTypeLabel(question.type)}
                        </span>
                        <span style={{ background: "#1e293b", color: "#cbd5e1", padding: "5px 9px", borderRadius: "7px", fontSize: "12px" }}>
                          {getDifficultyLabel(question.difficulty)}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: "15px", lineHeight: 2, whiteSpace: "pre-wrap", marginBottom: "16px" }}>
                      {question.question}
                    </p>

                    {question.options && (
                      <div style={{ display: "grid", gap: "10px" }}>
                        {question.options.map((option, optionIndex) => {
                          const isSelected = selected === option;

                          return (
                            <button
                              key={optionIndex}
                              type="button"
                              disabled={!!result}
                              onClick={() => handleSelectAnswer(question.id, option)}
                              style={{
                                width: "100%",
                                textAlign: isFa ? "right" : "left",
                                background: isSelected ? "#312e81" : "#111827",
                                border: isSelected
                                  ? "2px solid #8b5cf6"
                                  : "1px solid #344155",
                                color: "white",
                                borderRadius: "9px",
                                padding: "12px",
                                lineHeight: 1.8,
                                fontSize: "14px",
                                cursor: result ? "default" : "pointer",
                                transition: "0.15s",
                              }}
                            >
                              <span style={{ color: "#a78bfa", marginInlineEnd: "8px" }}>
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              {option}
                              {isSelected && (
                                <span style={{ color: "#c4b5fd", marginInlineStart: "10px" }}>
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {question.type === "descriptive" && (
                      <textarea
                        disabled={!!result}
                        value={descriptiveAnswers[question.id] || ""}
                        onChange={(e) =>
                          setDescriptiveAnswers((previous) => ({
                            ...previous,
                            [question.id]: e.target.value,
                          }))
                        }
                        rows={4}
                        placeholder={isFa ? "پاسخ خود را اینجا بنویس..." : "Write your answer here..."}
                        style={{
                          ...inputStyle,
                          resize: "vertical",
                          lineHeight: 2,
                          fontFamily: "inherit",
                        }}
                      />
                    )}

                    {questionResult && (
                      <div
                        style={{
                          marginTop: "16px",
                          padding: "14px",
                          borderRadius: "10px",
                          background: "#111827",
                          lineHeight: 2,
                        }}
                      >
                        <strong
                          style={{
                            color: questionResult.status === "correct"
                              ? "#34d399"
                              : questionResult.status === "incorrect"
                                ? "#f87171"
                                : "#fbbf24",
                          }}
                        >
                          {getResultStatus(questionResult.status)}
                        </strong>

                        {questionResult.correct_answer && (
                          <p style={{ marginTop: "8px" }}>
                            {isFa ? "پاسخ صحیح: " : "Correct answer: "}
                            {questionResult.correct_answer}
                          </p>
                        )}

                        {questionResult.explanation && (
                          <p style={{ color: "#cbd5e1", marginTop: "8px" }}>
                            {questionResult.explanation}
                          </p>
                        )}

                        {evaluation && (
                          <div
                            style={{
                              marginTop: "16px",
                              padding: "16px",
                              borderRadius: "10px",
                              border: "1px solid #334155",
                              background: "#0b1220",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "10px",
                                marginBottom: "12px",
                              }}
                            >
                              <strong style={{ color: "#a78bfa" }}>
                                {isFa ? "گزارش ارزیابی پاسخ" : "Answer Evaluation"}
                              </strong>

                              <span
                                style={{
                                  color: evaluation.status === "evaluated"
                                    ? "#34d399"
                                    : "#fbbf24",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                }}
                              >
                                {getEvaluationStatus(evaluation.status)}
                              </span>
                            </div>

                            {evaluation.status === "evaluated" && (
                              <div
                                style={{
                                  marginBottom: "16px",
                                  padding: "12px",
                                  borderRadius: "9px",
                                  background: "#172554",
                                }}
                              >
                                <span style={{ color: "#cbd5e1", fontSize: "13px" }}>
                                  {isFa ? "نمره پاسخ: " : "Answer Score: "}
                                </span>
                                <strong style={{ color: "#93c5fd" }}>
                                  {evaluation.score} / {evaluation.max_score}
                                </strong>
                              </div>
                            )}

                            {evaluation.strengths?.length > 0 && (
                              <div style={{ marginBottom: "16px" }}>
                                <strong style={{ color: "#34d399" }}>
                                  {isFa ? "نقاط قوت" : "Strengths"}
                                </strong>

                                <ul style={{ paddingInlineStart: "22px", marginTop: "8px" }}>
                                  {evaluation.strengths.map((item, itemIndex) => (
                                    <li key={itemIndex} style={{ color: "#cbd5e1", marginBottom: "5px" }}>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {evaluation.missing_points?.length > 0 && (
                              <div style={{ marginBottom: "16px" }}>
                                <strong style={{ color: "#fbbf24" }}>
                                  {isFa ? "نکات ناقص یا جاافتاده" : "Missing Points"}
                                </strong>

                                <ul style={{ paddingInlineStart: "22px", marginTop: "8px" }}>
                                  {evaluation.missing_points.map((item, itemIndex) => (
                                    <li key={itemIndex} style={{ color: "#cbd5e1", marginBottom: "5px" }}>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {evaluation.feedback && (
                              <div style={{ marginBottom: "16px" }}>
                                <strong style={{ color: "#60a5fa" }}>
                                  {isFa ? "بازخورد ارزیاب" : "Evaluator Feedback"}
                                </strong>

                                <p style={{ color: "#cbd5e1", marginTop: "8px" }}>
                                  {evaluation.feedback}
                                </p>
                              </div>
                            )}

                            {evaluation.suggested_answer && (
                              <div>
                                <strong style={{ color: "#a78bfa" }}>
                                  {isFa ? "پاسخ پیشنهادی" : "Suggested Answer"}
                                </strong>

                                <p
                                  style={{
                                    color: "#cbd5e1",
                                    marginTop: "8px",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {evaluation.suggested_answer}
                                </p>
                              </div>
                            )}

                            {evaluation.status === "manual_review" && (
                              <p style={{ color: "#fbbf24", fontSize: "12px", marginTop: "14px" }}>
                                {isFa
                                  ? "این پاسخ هنوز توسط هوش مصنوعی واقعی ارزیابی نشده است و برای نمره‌دهی به بررسی نیاز دارد."
                                  : "This answer has not been evaluated by a live AI model and requires review."}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {!result && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitExam}
                style={{
                  ...primaryButtonStyle,
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting
                  ? isFa ? "در حال ثبت پاسخ‌ها..." : "Submitting..."
                  : isFa ? "ثبت و تصحیح آزمون" : "Submit Exam"}
              </button>
            )}

            {result && (
              <div id="exam-result" style={{ marginTop: "28px" }}>
                <h2 style={{ fontSize: "22px", marginBottom: "18px", color: "#a78bfa" }}>
                  {isFa ? "نتیجه آزمون" : "Exam Results"}
                </h2>

                <div style={{ ...cardStyle, background: "#0b1220" }}>
                  <div style={{ textAlign: "center", marginBottom: "24px" }}>
                    <div style={{ color: "#94a3b8", marginBottom: "8px" }}>
                      {isFa ? "نمره سؤالات عینی" : "Objective Exam Score"}
                    </div>
                    <div style={{ fontSize: "42px", fontWeight: 800, color: "#34d399" }}>
                      {result.score.toFixed(1)}%
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "8px" }}>
                      {isFa
                        ? "این نمره فقط بر اساس سؤالات قابل تصحیح محاسبه شده است."
                        : "This score includes only automatically gradable questions."}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {[
                      [isFa ? "صحیح" : "Correct", result.correct_answers, "#34d399"],
                      [isFa ? "اشتباه" : "Incorrect", result.incorrect_answers, "#f87171"],
                      [isFa ? "بی‌پاسخ" : "Unanswered", result.unanswered_questions, "#fbbf24"],
                      [isFa ? "تشریحی" : "Descriptive", result.descriptive_questions, "#a78bfa"],
                    ].map(([label, value, color]) => (
                      <div
                        key={String(label)}
                        style={{
                          background: "#1e293b",
                          borderRadius: "10px",
                          padding: "14px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ color: String(color), fontSize: "23px", fontWeight: 800 }}>
                          {value}
                        </div>
                        <div style={{ color: "#cbd5e1", fontSize: "12px", marginTop: "5px" }}>
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {result.descriptive_questions > 0 && (
                    <div
                      style={{
                        marginTop: "20px",
                        padding: "16px",
                        borderRadius: "10px",
                        background: "#111827",
                        border: "1px solid #334155",
                      }}
                    >
                      <strong style={{ color: "#a78bfa" }}>
                        {isFa ? "وضعیت ارزیابی تشریحی" : "Descriptive Evaluation Status"}
                      </strong>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                          gap: "12px",
                          marginTop: "14px",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "24px", fontWeight: 800, color: "#34d399" }}>
                            {result.evaluated_descriptive_questions ?? 0}
                          </div>
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                            {isFa ? "ارزیابی‌شده" : "Evaluated"}
                          </span>
                        </div>

                        <div>
                          <div style={{ fontSize: "24px", fontWeight: 800, color: "#fbbf24" }}>
                            {result.manual_review_descriptive_questions ?? 0}
                          </div>
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                            {isFa ? "نیازمند بررسی دستی" : "Manual Review"}
                          </span>
                        </div>
                      </div>

                      {(result.manual_review_descriptive_questions ?? 0) > 0 && (
                        <p style={{ color: "#fbbf24", marginTop: "16px", lineHeight: 2, fontSize: "13px" }}>
                          {isFa
                            ? "بخشی از پاسخ‌های تشریحی هنوز توسط موتور هوش مصنوعی واقعی تصحیح نشده‌اند و در نمره خودکار لحاظ نشده‌اند."
                            : "Some descriptive answers have not been evaluated by a live AI model and are excluded from the automatic score."}
                        </p>
                      )}

                      {(result.evaluated_descriptive_questions ?? 0) > 0 && (
                        <div style={{ marginTop: "16px" }}>
                          <strong style={{ color: "#34d399" }}>
                            {isFa ? "مجموع نمره تشریحی" : "Descriptive Score"}
                          </strong>
                          <p style={{ color: "#cbd5e1", marginTop: "6px" }}>
                            {result.descriptive_score} / {result.descriptive_max_score}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
