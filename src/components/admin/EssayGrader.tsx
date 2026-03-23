"use client";

import { useState } from "react";
import { gradeEssay } from "@/app/actions/attempts";

type EssayData = {
  responseId: string;
  attemptId: string;
  questionContent: string;
  questionPoints: number;
  questionExplanation: string | null;
  answerText: string;
  studentName: string;
  testTitle: string;
};

export function EssayGrader({ essay }: { essay: EssayData }) {
  const [points, setPoints] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [graded, setGraded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGrade = async () => {
    setSaving(true);
    setError(null);
    const result = await gradeEssay(
      essay.attemptId,
      essay.responseId,
      points,
      feedback
    );
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setGraded(true);
    }
  };

  if (graded) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <p className="font-medium text-green-700">
          Graded: {points}/{essay.questionPoints} points
        </p>
        <p className="mt-1 text-sm text-green-600">
          {essay.studentName} — {essay.testTitle}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {essay.studentName} — {essay.testTitle}
          </p>
          <p className="mt-1 font-medium">{essay.questionContent}</p>
        </div>
        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
          {essay.questionPoints} pts
        </span>
      </div>

      {essay.questionExplanation && (
        <div className="mt-3 rounded-md bg-teal-50 p-3 text-sm text-teal-700">
          <span className="font-medium">Rubric:</span>{" "}
          {essay.questionExplanation}
        </div>
      )}

      <div className="mt-4 rounded-md bg-gray-50 p-4">
        <p className="mb-1 text-xs font-medium text-gray-500">
          Student Response
        </p>
        <div className="whitespace-pre-wrap text-sm text-gray-800">
          {essay.answerText}
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Points (0-{essay.questionPoints})
          </label>
          <input
            type="number"
            min={0}
            max={essay.questionPoints}
            value={points}
            onChange={(e) =>
              setPoints(
                Math.min(essay.questionPoints, Math.max(0, Number(e.target.value)))
              )
            }
            className="mt-1 w-24 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="Feedback for the student..."
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={handleGrade}
          disabled={saving}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Grade"}
        </button>
      </div>
    </div>
  );
}
