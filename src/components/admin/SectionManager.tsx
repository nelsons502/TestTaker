"use client";

import { useState } from "react";
import {
  createSection,
  updateSection,
  deleteSection,
  reorderSection,
} from "@/app/actions/sections";
import { deleteQuestion, reorderQuestion } from "@/app/actions/questions";
import { QuestionEditor } from "./QuestionEditor";
import type { Database } from "@/types/database";

type Section = Database["public"]["Tables"]["sections"]["Row"];
type Question = Database["public"]["Tables"]["questions"]["Row"];
type AnswerOption = Database["public"]["Tables"]["answer_options"]["Row"];

export function SectionManager({
  testId,
  sections,
  questions,
  answerOptions,
}: {
  testId: string;
  sections: Section[];
  questions: Question[];
  answerOptions: AnswerOption[];
}) {
  const [addingSection, setAddingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [addingQuestionToSection, setAddingQuestionToSection] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const createSectionWithId = createSection.bind(null, testId);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Sections & Questions</h2>
        <button
          onClick={() => setAddingSection(true)}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Section
        </button>
      </div>

      {addingSection && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <form
            action={async (formData: FormData) => {
              await createSectionWithId(formData);
              setAddingSection(false);
            }}
            className="space-y-3"
          >
            <input
              name="title"
              type="text"
              required
              placeholder="Section title"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <input
              name="description"
              type="text"
              placeholder="Description (optional)"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAddingSection(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {sections.length === 0 && !addingSection && (
        <div className="mt-4 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">
            No sections yet. Add a section to start building your test.
          </p>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {sections.map((section, sIdx) => {
          const sectionQuestions = questions
            .filter((q) => q.section_id === section.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          const sectionOptions = answerOptions.filter((o) =>
            sectionQuestions.some((q) => q.id === o.question_id)
          );

          return (
            <div
              key={section.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              {/* Section header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                {editingSectionId === section.id ? (
                  <form
                    action={async (formData: FormData) => {
                      await updateSection(testId, section.id, formData);
                      setEditingSectionId(null);
                    }}
                    className="flex flex-1 items-center gap-2"
                  >
                    <input
                      name="title"
                      type="text"
                      defaultValue={section.title}
                      required
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <input
                      name="description"
                      type="text"
                      defaultValue={section.description ?? ""}
                      placeholder="Description"
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSectionId(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div>
                    <h3 className="font-semibold">
                      Section {sIdx + 1}: {section.title}
                    </h3>
                    {section.description && (
                      <p className="text-sm text-gray-500">{section.description}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  {sIdx > 0 && (
                    <button
                      onClick={() => reorderSection(testId, section.id, "up")}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Move up"
                    >
                      ↑
                    </button>
                  )}
                  {sIdx < sections.length - 1 && (
                    <button
                      onClick={() => reorderSection(testId, section.id, "down")}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Move down"
                    >
                      ↓
                    </button>
                  )}
                  <button
                    onClick={() => setEditingSectionId(section.id)}
                    className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        confirm(
                          `Delete section "${section.title}" and all its questions?`
                        )
                      ) {
                        await deleteSection(testId, section.id);
                      }
                    }}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Questions */}
              <div className="p-4">
                {sectionQuestions.length === 0 && (
                  <p className="py-2 text-center text-sm text-gray-400">
                    No questions in this section
                  </p>
                )}

                <div className="space-y-3">
                  {sectionQuestions.map((question, qIdx) => {
                    const qOptions = sectionOptions
                      .filter((o) => o.question_id === question.id)
                      .sort((a, b) => a.sort_order - b.sort_order);

                    if (editingQuestionId === question.id) {
                      return (
                        <QuestionEditor
                          key={question.id}
                          testId={testId}
                          sectionId={section.id}
                          question={question}
                          answerOptions={qOptions}
                          onClose={() => setEditingQuestionId(null)}
                        />
                      );
                    }

                    return (
                      <div
                        key={question.id}
                        className="rounded-md border border-gray-100 bg-gray-50 p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-500">
                                Q{qIdx + 1}
                              </span>
                              <span className="inline-flex rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
                                {question.question_type.replace("_", " ")}
                              </span>
                              <span className="text-xs text-gray-400">
                                {question.points} pt{question.points !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">{question.content}</p>

                            {/* Show answer options */}
                            {qOptions.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {qOptions.map((opt) => (
                                  <div
                                    key={opt.id}
                                    className={`flex items-center gap-1.5 text-xs ${
                                      opt.is_correct
                                        ? "font-medium text-green-700"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    <span>
                                      {opt.is_correct ? "✓" : "○"}
                                    </span>
                                    {opt.content}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Show accepted answers for short answer */}
                            {question.question_type === "short_answer" &&
                              question.accepted_answers &&
                              question.accepted_answers.length > 0 && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Accepted: {question.accepted_answers.join(", ")}
                                </p>
                              )}
                          </div>

                          <div className="flex items-center gap-1">
                            {qIdx > 0 && (
                              <button
                                onClick={() =>
                                  reorderQuestion(testId, question.id, section.id, "up")
                                }
                                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                                title="Move up"
                              >
                                ↑
                              </button>
                            )}
                            {qIdx < sectionQuestions.length - 1 && (
                              <button
                                onClick={() =>
                                  reorderQuestion(testId, question.id, section.id, "down")
                                }
                                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                                title="Move down"
                              >
                                ↓
                              </button>
                            )}
                            <button
                              onClick={() => setEditingQuestionId(question.id)}
                              className="ml-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm("Delete this question?")) {
                                  await deleteQuestion(testId, question.id);
                                }
                              }}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add question */}
                {addingQuestionToSection === section.id ? (
                  <div className="mt-3">
                    <QuestionEditor
                      testId={testId}
                      sectionId={section.id}
                      onClose={() => setAddingQuestionToSection(null)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingQuestionToSection(section.id)}
                    className="mt-3 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
                  >
                    + Add Question
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
