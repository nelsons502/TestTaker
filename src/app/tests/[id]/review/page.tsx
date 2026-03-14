import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ReviewPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  if (!searchParams.attempt) {
    redirect(`/tests/${params.id}`);
  }

  const attemptId = searchParams.attempt;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  // Fetch attempt
  const { data: attempt } = await supabase
    .from("attempts")
    .select("id, status, score, max_score, started_at, submitted_at, question_order, option_order")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (!attempt) notFound();
  if (attempt.status === "in_progress") {
    redirect(`/tests/${params.id}/take?attempt=${attemptId}`);
  }

  // Fetch test
  const { data: test } = await supabase
    .from("tests")
    .select("id, title, subject")
    .eq("id", params.id)
    .single<{ id: string; title: string; subject: string }>();

  if (!test) notFound();

  // Fetch sections, questions, options, and responses
  const { data: sections } = await supabase
    .from("sections")
    .select("id, title, sort_order")
    .eq("test_id", params.id)
    .order("sort_order")
    .returns<{ id: string; title: string; sort_order: number }[]>();

  const sectionIds = (sections || []).map((s) => s.id);

  const { data: questions } = await supabase
    .from("questions")
    .select(
      "id, section_id, question_type, content, explanation, points, sort_order, accepted_answers"
    )
    .in("section_id", sectionIds)
    .order("sort_order")
    .returns<
      {
        id: string;
        section_id: string;
        question_type: string;
        content: string;
        explanation: string | null;
        points: number;
        sort_order: number;
        accepted_answers: string[] | null;
      }[]
    >();

  const questionIds = (questions || []).map((q) => q.id);

  let answerOptions: {
    id: string;
    question_id: string;
    content: string;
    is_correct: boolean;
    sort_order: number;
  }[] = [];

  if (questionIds.length > 0) {
    const { data } = await supabase
      .from("answer_options")
      .select("id, question_id, content, is_correct, sort_order")
      .in("question_id", questionIds)
      .order("sort_order")
      .returns<
        {
          id: string;
          question_id: string;
          content: string;
          is_correct: boolean;
          sort_order: number;
        }[]
      >();
    answerOptions = data || [];
  }

  const { data: responses } = await supabase
    .from("responses")
    .select(
      "question_id, answer_text, selected_option_id, is_correct, points_awarded, feedback"
    )
    .eq("attempt_id", attemptId)
    .returns<
      {
        question_id: string;
        answer_text: string | null;
        selected_option_id: string | null;
        is_correct: boolean | null;
        points_awarded: number | null;
        feedback: string | null;
      }[]
    >();

  // Calculate score by section
  const sectionScores = (sections || []).map((section) => {
    const sectionQuestions = (questions || []).filter(
      (q) => q.section_id === section.id
    );
    const maxPoints = sectionQuestions.reduce((s, q) => s + q.points, 0);
    const earned = sectionQuestions.reduce((s, q) => {
      const r = (responses || []).find((r) => r.question_id === q.id);
      return s + (r?.points_awarded ?? 0);
    }, 0);
    return { title: section.title, earned, maxPoints };
  });

  const percentage = attempt.max_score
    ? Math.round(((attempt.score ?? 0) / attempt.max_score) * 100)
    : 0;

  const timeTaken = attempt.submitted_at && attempt.started_at
    ? Math.round(
        (new Date(attempt.submitted_at).getTime() -
          new Date(attempt.started_at).getTime()) /
          60000
      )
    : null;

  // Build ordered question list (using stored randomized order if available)
  const questionOrder = attempt.question_order as string[] | null;
  const optionOrderMap = attempt.option_order as Record<string, string[]> | null;
  const sectionMap = new Map((sections || []).map((s) => [s.id, s.title]));
  const questionMap = new Map((questions || []).map((q) => [q.id, q]));

  let orderedQuestions;
  if (questionOrder && questionOrder.length > 0) {
    orderedQuestions = questionOrder
      .map((qId) => questionMap.get(qId))
      .filter(Boolean)
      .map((q) => {
        const optOrder = optionOrderMap?.[q!.id];
        const qOpts = answerOptions.filter((o) => o.question_id === q!.id);
        const sortedOpts = optOrder
          ? optOrder.map((oId) => qOpts.find((o) => o.id === oId)).filter(Boolean) as typeof qOpts
          : qOpts.sort((a, b) => a.sort_order - b.sort_order);
        return {
          ...q!,
          sectionTitle: sectionMap.get(q!.section_id) || "",
          options: sortedOpts,
          response: (responses || []).find((r) => r.question_id === q!.id),
        };
      });
  } else {
    orderedQuestions = (sections || []).flatMap((section) =>
      (questions || [])
        .filter((q) => q.section_id === section.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((q) => ({
          ...q,
          sectionTitle: section.title,
          options: answerOptions
            .filter((o) => o.question_id === q.id)
            .sort((a, b) => a.sort_order - b.sort_order),
          response: (responses || []).find((r) => r.question_id === q.id),
        }))
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/tests/${params.id}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Test
      </Link>

      {/* Score summary */}
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-sm text-gray-500">{test.title}</p>
          <p
            className={`mt-2 text-5xl font-bold ${
              percentage >= 70
                ? "text-green-600"
                : percentage >= 50
                  ? "text-yellow-600"
                  : "text-red-600"
            }`}
          >
            {percentage}%
          </p>
          <p className="mt-1 text-lg text-gray-600">
            {attempt.score ?? 0} / {attempt.max_score ?? 0} points
          </p>
          {timeTaken !== null && (
            <p className="mt-1 text-sm text-gray-400">
              Completed in {timeTaken} minute{timeTaken !== 1 ? "s" : ""}
            </p>
          )}
          {attempt.status === "submitted" && (
            <p className="mt-2 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
              Essay questions pending review
            </p>
          )}
        </div>

        {/* Section breakdown */}
        <div className="mt-6 space-y-2">
          {sectionScores.map((s) => (
            <div key={s.title} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{s.title}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full ${
                      s.maxPoints > 0 && s.earned / s.maxPoints >= 0.7
                        ? "bg-green-500"
                        : s.maxPoints > 0 && s.earned / s.maxPoints >= 0.5
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: `${s.maxPoints > 0 ? (s.earned / s.maxPoints) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-16 text-right text-xs text-gray-500">
                  {s.earned}/{s.maxPoints}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href={`/tests/${params.id}`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Try Again
          </Link>
          <Link
            href="/tests"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse Tests
          </Link>
        </div>
      </div>

      {/* Question-by-question review */}
      <h2 className="mt-8 text-xl font-bold">Question Review</h2>
      <div className="mt-4 space-y-4">
        {orderedQuestions.map((q, idx) => {
          const r = q.response;
          const isCorrect = r?.is_correct;
          const isUnanswered = !r;
          const isEssay = q.question_type === "essay";

          return (
            <div
              key={q.id}
              className={`rounded-lg border p-5 ${
                isEssay
                  ? "border-gray-200 bg-white"
                  : isUnanswered
                    ? "border-gray-200 bg-gray-50"
                    : isCorrect
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">
                    Q{idx + 1}
                  </span>
                  <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
                    {q.question_type.replace("_", " ")}
                  </span>
                  <span className="text-xs text-gray-400">{q.sectionTitle}</span>
                </div>
                <div className="text-sm font-medium">
                  {isEssay ? (
                    <span className="text-yellow-600">
                      {r?.points_awarded ?? "?"}/{q.points}
                    </span>
                  ) : isUnanswered ? (
                    <span className="text-gray-400">0/{q.points}</span>
                  ) : isCorrect ? (
                    <span className="text-green-600">
                      {r.points_awarded}/{q.points}
                    </span>
                  ) : (
                    <span className="text-red-600">0/{q.points}</span>
                  )}
                </div>
              </div>

              <p className="mt-2">{q.content}</p>

              {/* MC / TF review */}
              {(q.question_type === "multiple_choice" ||
                q.question_type === "true_false") && (
                <div className="mt-3 space-y-1.5">
                  {q.options.map((opt) => {
                    const wasSelected = r?.selected_option_id === opt.id;
                    const isCorrectOption = opt.is_correct;
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                          isCorrectOption
                            ? "bg-green-100 font-medium text-green-800"
                            : wasSelected
                              ? "bg-red-100 text-red-700"
                              : "text-gray-600"
                        }`}
                      >
                        <span>
                          {isCorrectOption
                            ? "✓"
                            : wasSelected
                              ? "✗"
                              : "○"}
                        </span>
                        <span>{opt.content}</span>
                        {wasSelected && !isCorrectOption && (
                          <span className="ml-auto text-xs text-red-500">
                            Your answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Short answer review */}
              {q.question_type === "short_answer" && (
                <div className="mt-3 text-sm">
                  <p>
                    <span className="font-medium">Your answer:</span>{" "}
                    <span className={isCorrect ? "text-green-700" : "text-red-700"}>
                      {r?.answer_text || "(no answer)"}
                    </span>
                  </p>
                  {!isCorrect && q.accepted_answers && (
                    <p className="mt-1 text-green-700">
                      <span className="font-medium">Accepted:</span>{" "}
                      {q.accepted_answers.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Essay review */}
              {q.question_type === "essay" && (
                <div className="mt-3 text-sm">
                  {r?.answer_text ? (
                    <div className="rounded-md bg-gray-50 p-3 text-gray-700">
                      {r.answer_text}
                    </div>
                  ) : (
                    <p className="text-gray-400">(no response)</p>
                  )}
                  {r?.feedback && (
                    <div className="mt-2 rounded-md bg-blue-50 p-3 text-blue-800">
                      <span className="font-medium">Feedback:</span> {r.feedback}
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {q.explanation && (
                <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                  <span className="font-medium">Explanation:</span>{" "}
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
