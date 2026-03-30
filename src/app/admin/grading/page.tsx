import { createClient } from "@/lib/supabase/server";
import { EssayGrader } from "@/components/admin/EssayGrader";

export default async function GradingPage() {
  const supabase = await createClient();

  // Find essay responses that need grading
  const { data: essayQuestions } = await supabase
    .from("questions")
    .select("id")
    .eq("question_type", "essay")
    .returns<{ id: string }[]>();

  const essayQuestionIds = (essayQuestions || []).map((q) => q.id);

  if (essayQuestionIds.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold">Essay Grading</h1>
        <p className="mt-4 text-gray-500">No essay questions exist yet.</p>
      </div>
    );
  }

  const { data: ungradedResponses } = await supabase
    .from("responses")
    .select(
      "id, attempt_id, question_id, answer_text, points_awarded, feedback, graded_by"
    )
    .in("question_id", essayQuestionIds)
    .not("answer_text", "is", null)
    .is("graded_by", null)
    .returns<
      {
        id: string;
        attempt_id: string;
        question_id: string;
        answer_text: string | null;
        points_awarded: number | null;
        feedback: string | null;
        graded_by: string | null;
      }[]
    >();

  // Get question content and attempt info
  const questionIds = [
    ...new Set((ungradedResponses || []).map((r) => r.question_id)),
  ];
  const attemptIds = [
    ...new Set((ungradedResponses || []).map((r) => r.attempt_id)),
  ];

  let questionMap = new Map<
    string,
    { content: string; points: number; explanation: string | null }
  >();
  if (questionIds.length > 0) {
    const { data } = await supabase
      .from("questions")
      .select("id, content, points, explanation")
      .in("id", questionIds)
      .returns<
        {
          id: string;
          content: string;
          points: number;
          explanation: string | null;
        }[]
      >();
    questionMap = new Map(
      (data || []).map((q) => [
        q.id,
        { content: q.content, points: q.points, explanation: q.explanation },
      ])
    );
  }

  let attemptMap = new Map<
    string,
    { test_id: string; user_id: string; test_title: string; student_name: string }
  >();
  if (attemptIds.length > 0) {
    const { data: attempts } = await supabase
      .from("attempts")
      .select("id, test_id, user_id")
      .in("id", attemptIds)
      .returns<{ id: string; test_id: string; user_id: string }[]>();

    const aTestIds = [...new Set((attempts || []).map((a) => a.test_id))];
    const aUserIds = [...new Set((attempts || []).map((a) => a.user_id))];

    let testNames = new Map<string, string>();
    if (aTestIds.length > 0) {
      const { data } = await supabase
        .from("tests")
        .select("id, title")
        .in("id", aTestIds)
        .returns<{ id: string; title: string }[]>();
      testNames = new Map((data || []).map((t) => [t.id, t.title]));
    }

    let userNames = new Map<string, string>();
    if (aUserIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", aUserIds)
        .returns<{ id: string; full_name: string | null }[]>();
      userNames = new Map(
        (data || []).map((u) => [u.id, u.full_name || "Unknown"])
      );
    }

    attemptMap = new Map(
      (attempts || []).map((a) => [
        a.id,
        {
          test_id: a.test_id,
          user_id: a.user_id,
          test_title: testNames.get(a.test_id) || "Test",
          student_name: userNames.get(a.user_id) || "Unknown",
        },
      ])
    );
  }

  const essaysToGrade = (ungradedResponses || []).map((r) => {
    const question = questionMap.get(r.question_id);
    const attempt = attemptMap.get(r.attempt_id);
    return {
      responseId: r.id,
      attemptId: r.attempt_id,
      questionContent: question?.content ?? "",
      questionPoints: question?.points ?? 1,
      questionExplanation: question?.explanation ?? null,
      answerText: r.answer_text ?? "",
      studentName: attempt?.student_name ?? "Unknown",
      testTitle: attempt?.test_title ?? "Test",
    };
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Essay Grading</h1>
      <p className="mt-1 text-sm text-gray-500">
        {essaysToGrade.length} essay
        {essaysToGrade.length !== 1 ? "s" : ""} awaiting review
      </p>

      {essaysToGrade.length === 0 ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">All essays have been graded!</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {essaysToGrade.map((essay) => (
            <EssayGrader key={essay.responseId} essay={essay} />
          ))}
        </div>
      )}
    </div>
  );
}
