"use client";

import { useState } from "react";
import { createQuestion, updateQuestion } from "@/app/actions/questions";
import type { Database } from "@/types/database";

type Question = Database["public"]["Tables"]["questions"]["Row"];
type AnswerOption = Database["public"]["Tables"]["answer_options"]["Row"];
type QuestionType = Question["question_type"];

export function QuestionEditor({
  testId,
  sectionId,
  question,
  answerOptions,
  onClose,
}: {
  testId: string;
  sectionId: string;
  question?: Question;
  answerOptions?: AnswerOption[];
  onClose: () => void;
}) {
  const isEditing = !!question;

  const [questionType, setQuestionType] = useState<QuestionType>(
    question?.question_type ?? "multiple_choice"
  );
  const [options, setOptions] = useState<Array<{ content: string; isCorrect: boolean }>>(
    answerOptions && answerOptions.length > 0
      ? answerOptions.map((o) => ({ content: o.content, isCorrect: o.is_correct }))
      : [
          { content: "", isCorrect: true },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
        ]
  );
  const [tfAnswer, setTfAnswer] = useState<string>(
    answerOptions?.find((o) => o.is_correct)?.content === "False" ? "false" : "true"
  );

  const handleSubmit = async (formData: FormData) => {
    // Add MC options to formData
    if (questionType === "multiple_choice") {
      formData.set("option_count", String(options.length));
      const correctIdx = options.findIndex((o) => o.isCorrect);
      formData.set("correct_option", String(correctIdx >= 0 ? correctIdx : 0));
      options.forEach((opt, i) => {
        formData.set(`option_${i}_content`, opt.content);
      });
    } else if (questionType === "true_false") {
      formData.set("correct_option", tfAnswer);
    }

    if (isEditing) {
      await updateQuestion(testId, question.id, formData);
    } else {
      await createQuestion(testId, sectionId, formData);
    }
    onClose();
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h4 className="mb-3 font-medium">
        {isEditing ? "Edit Question" : "New Question"}
      </h4>

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="question_type" value={questionType} />

        {/* Question type selector (only for new questions) */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Question Type
            </label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
              <option value="essay">Essay</option>
            </select>
          </div>
        )}

        {/* Question content */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Question
          </label>
          <textarea
            name="content"
            required
            rows={2}
            defaultValue={question?.content ?? ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter the question text..."
          />
        </div>

        {/* Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Points
          </label>
          <input
            name="points"
            type="number"
            min={1}
            defaultValue={question?.points ?? 1}
            className="mt-1 block w-24 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Multiple Choice options */}
        {questionType === "multiple_choice" && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Answer Options
            </label>
            <p className="mb-2 text-xs text-gray-500">
              Select the radio button next to the correct answer
            </p>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct_mc"
                    checked={opt.isCorrect}
                    onChange={() => {
                      setOptions(
                        options.map((o, j) => ({
                          ...o,
                          isCorrect: j === i,
                        }))
                      );
                    }}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={opt.content}
                    onChange={(e) => {
                      const updated = [...options];
                      updated[i] = { ...updated[i], content: e.target.value };
                      setOptions(updated);
                    }}
                    required
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = options.filter((_, j) => j !== i);
                        // Ensure at least one correct
                        if (opt.isCorrect && updated.length > 0) {
                          updated[0].isCorrect = true;
                        }
                        setOptions(updated);
                      }}
                      className="text-sm text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button
                type="button"
                onClick={() =>
                  setOptions([...options, { content: "", isCorrect: false }])
                }
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Option
              </button>
            )}
          </div>
        )}

        {/* True/False */}
        {questionType === "true_false" && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Correct Answer
            </label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tf_answer"
                  value="true"
                  checked={tfAnswer === "true"}
                  onChange={() => setTfAnswer("true")}
                  className="h-4 w-4 border-gray-300 text-blue-600"
                />
                <span className="text-sm">True</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tf_answer"
                  value="false"
                  checked={tfAnswer === "false"}
                  onChange={() => setTfAnswer("false")}
                  className="h-4 w-4 border-gray-300 text-blue-600"
                />
                <span className="text-sm">False</span>
              </label>
            </div>
          </div>
        )}

        {/* Short Answer */}
        {questionType === "short_answer" && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Accepted Answers (one per line)
            </label>
            <textarea
              name="accepted_answers"
              rows={3}
              defaultValue={question?.accepted_answers?.join("\n") ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={"answer 1\nanswer 2\n..."}
            />
            <p className="mt-1 text-xs text-gray-500">
              Matching is case-insensitive and trimmed
            </p>
          </div>
        )}

        {/* Essay instructions */}
        {questionType === "essay" && (
          <p className="text-sm text-gray-500">
            Essay questions are manually graded by an admin after submission.
          </p>
        )}

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Explanation (shown during review)
          </label>
          <textarea
            name="explanation"
            rows={2}
            defaultValue={question?.explanation ?? ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Explain why this is the correct answer..."
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {isEditing ? "Update" : "Add Question"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
