"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { saveResponse, submitAttempt } from "@/app/actions/attempts";

type Question = {
  id: string;
  section_id: string;
  question_type: string;
  content: string;
  points: number;
  sectionTitle: string;
  options: { id: string; content: string }[];
};

type ExistingResponse = {
  question_id: string;
  answer_text: string | null;
  selected_option_id: string | null;
};

export function TestTakingUI({
  testId,
  testTitle,
  attemptId,
  questions,
  existingResponses,
  deadlineISO,
}: {
  testId: string;
  testTitle: string;
  attemptId: string;
  questions: Question[];
  existingResponses: ExistingResponse[];
  deadlineISO: string | null;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Map<string, { answer_text?: string | null; selected_option_id?: string | null }>
  >(() => {
    const map = new Map();
    for (const r of existingResponses) {
      map.set(r.question_id, {
        answer_text: r.answer_text,
        selected_option_id: r.selected_option_id,
      });
    }
    return map;
  });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const question = questions[currentIndex];
  const currentAnswer = answers.get(question?.id);

  // Timer
  useEffect(() => {
    if (!deadlineISO) return;
    const deadline = new Date(deadlineISO).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        handleSubmit();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadlineISO]);

  const persistAnswer = useCallback(
    (questionId: string, data: { answer_text?: string | null; selected_option_id?: string | null }) => {
      // Debounce saves for text inputs
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        setSaving(true);
        await saveResponse(attemptId, questionId, data);
        setSaving(false);
      }, 500);
    },
    [attemptId]
  );

  const setAnswer = (
    questionId: string,
    data: { answer_text?: string | null; selected_option_id?: string | null }
  ) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, data);
      return next;
    });
    persistAnswer(questionId, data);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    // Flush any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Save current answer immediately if exists
    if (question && currentAnswer) {
      await saveResponse(attemptId, question.id, currentAnswer);
    }
    await submitAttempt(testId, attemptId);
  };

  const answeredCount = answers.size;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (!question) return null;

  // Determine which section we're in for the sidebar
  let currentSection = "";
  const sectionQuestionMap = new Map<string, number[]>();
  questions.forEach((q, i) => {
    const list = sectionQuestionMap.get(q.sectionTitle) || [];
    list.push(i);
    sectionQuestionMap.set(q.sectionTitle, list);
  });

  currentSection = question.sectionTitle;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="truncate text-sm font-semibold">{testTitle}</h1>
        <div className="flex items-center gap-4">
          {saving && (
            <span className="text-xs text-gray-400">Saving...</span>
          )}
          <span className="text-xs text-gray-500">
            {answeredCount}/{questions.length} answered
          </span>
          {timeLeft !== null && (
            <span
              className={`rounded-md px-2 py-1 text-sm font-mono font-medium ${
                timeLeft < 300
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          )}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Submit
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Question sidebar */}
        <aside className="hidden w-56 overflow-y-auto border-r border-gray-200 bg-white p-4 md:block">
          {Array.from(sectionQuestionMap.entries()).map(
            ([sectionTitle, indices]) => (
              <div key={sectionTitle} className="mb-4">
                <p
                  className={`mb-2 text-xs font-semibold uppercase tracking-wider ${
                    currentSection === sectionTitle
                      ? "text-teal-600"
                      : "text-gray-400"
                  }`}
                >
                  {sectionTitle}
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {indices.map((idx) => {
                    const q = questions[idx];
                    const isAnswered = answers.has(q.id);
                    const isCurrent = idx === currentIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`flex h-8 w-8 items-center justify-center rounded text-xs font-medium ${
                          isCurrent
                            ? "bg-teal-600 text-white"
                            : isAnswered
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </aside>

        {/* Main question area */}
        <main className="flex flex-1 flex-col p-6 md:p-8">
          <div className="mx-auto w-full max-w-2xl flex-1">
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                {question.question_type.replace("_", " ")}
              </span>
              <span className="text-xs">
                {question.points} pt{question.points !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="mb-1 text-xs text-gray-400">{question.sectionTitle}</p>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-lg">{question.content}</p>

              <div className="mt-6">
                {/* Multiple choice / True-false */}
                {(question.question_type === "multiple_choice" ||
                  question.question_type === "true_false") && (
                  <div className="space-y-2">
                    {question.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                          currentAnswer?.selected_option_id === opt.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${question.id}`}
                          checked={currentAnswer?.selected_option_id === opt.id}
                          onChange={() =>
                            setAnswer(question.id, {
                              selected_option_id: opt.id,
                            })
                          }
                          className="h-4 w-4 border-gray-300 text-teal-600"
                        />
                        <span className="text-sm">{opt.content}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Short answer */}
                {question.question_type === "short_answer" && (
                  <input
                    type="text"
                    value={currentAnswer?.answer_text ?? ""}
                    onChange={(e) =>
                      setAnswer(question.id, {
                        answer_text: e.target.value,
                      })
                    }
                    placeholder="Type your answer..."
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                )}

                {/* Essay */}
                {question.question_type === "essay" && (
                  <textarea
                    value={currentAnswer?.answer_text ?? ""}
                    onChange={(e) =>
                      setAnswer(question.id, {
                        answer_text: e.target.value,
                      })
                    }
                    rows={10}
                    placeholder="Write your response..."
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mx-auto mt-6 flex w-full max-w-2xl items-center justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>

            {/* Mobile question nav */}
            <div className="flex gap-1 md:hidden">
              {questions.map((q, idx) => {
                const isAnswered = answers.has(q.id);
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2.5 w-2.5 rounded-full ${
                      isCurrent
                        ? "bg-teal-600"
                        : isAnswered
                          ? "bg-green-400"
                          : "bg-gray-300"
                    }`}
                    aria-label={`Question ${idx + 1}`}
                  />
                );
              })}
            </div>

            <button
              onClick={() =>
                setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
              }
              disabled={currentIndex === questions.length - 1}
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </main>
      </div>

      {/* Submit confirmation modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Submit Test?</h2>
            <p className="mt-2 text-sm text-gray-600">
              You have answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="mt-1 block font-medium text-amber-600">
                  {questions.length - answeredCount} question
                  {questions.length - answeredCount !== 1 ? "s" : ""} unanswered.
                </span>
              )}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Once submitted, you cannot change your answers.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Keep Working
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Test"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
