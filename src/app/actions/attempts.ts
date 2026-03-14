"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");
  return { supabase, user };
}

/** Fisher-Yates shuffle (returns new array) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function startAttempt(testId: string) {
  const { supabase, user } = await requireUser();

  // Check for existing in-progress attempt
  const { data: existing } = await supabase
    .from("attempts")
    .select("id")
    .eq("test_id", testId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .single<{ id: string }>();

  if (existing) {
    redirect(`/tests/${testId}/take?attempt=${existing.id}`);
  }

  // Fetch sections, questions, and options to build randomized orders
  const { data: sections } = await supabase
    .from("sections")
    .select("id")
    .eq("test_id", testId)
    .order("sort_order")
    .returns<{ id: string }[]>();

  const sectionIds = (sections || []).map((s) => s.id);
  let allQuestions: { id: string; section_id: string; question_type: string; sort_order: number }[] = [];

  if (sectionIds.length > 0) {
    const { data } = await supabase
      .from("questions")
      .select("id, section_id, question_type, sort_order")
      .in("section_id", sectionIds)
      .order("sort_order")
      .returns<{ id: string; section_id: string; question_type: string; sort_order: number }[]>();
    allQuestions = data || [];
  }

  // Build randomized question order: shuffle within each section, then concatenate
  const questionOrder: string[] = [];
  for (const section of sections || []) {
    const sectionQs = allQuestions.filter((q) => q.section_id === section.id);
    const shuffled = shuffle(sectionQs);
    questionOrder.push(...shuffled.map((q) => q.id));
  }

  // Build randomized option order for MC/TF questions
  const mcTfIds = allQuestions
    .filter((q) => q.question_type === "multiple_choice" || q.question_type === "true_false")
    .map((q) => q.id);

  const optionOrder: Record<string, string[]> = {};
  if (mcTfIds.length > 0) {
    const { data: options } = await supabase
      .from("answer_options")
      .select("id, question_id")
      .in("question_id", mcTfIds)
      .order("sort_order")
      .returns<{ id: string; question_id: string }[]>();

    for (const qId of mcTfIds) {
      const qOpts = (options || []).filter((o) => o.question_id === qId);
      optionOrder[qId] = shuffle(qOpts).map((o) => o.id);
    }
  }

  const { data: attempt, error } = await supabase
    .from("attempts")
    .insert({
      test_id: testId,
      user_id: user.id,
      question_order: questionOrder,
      option_order: optionOrder,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    redirect(`/tests/${testId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/tests/${testId}/take?attempt=${attempt.id}`);
}

export async function saveResponse(
  attemptId: string,
  questionId: string,
  data: {
    answer_text?: string | null;
    selected_option_id?: string | null;
  }
) {
  const { supabase } = await requireUser();

  const { error } = await supabase.from("responses").upsert(
    {
      attempt_id: attemptId,
      question_id: questionId,
      answer_text: data.answer_text ?? null,
      selected_option_id: data.selected_option_id ?? null,
    },
    { onConflict: "attempt_id,question_id" }
  );

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function submitAttempt(testId: string, attemptId: string) {
  const { supabase } = await requireUser();

  const { data: sections } = await supabase
    .from("sections")
    .select("id")
    .eq("test_id", testId)
    .returns<{ id: string }[]>();

  if (!sections || sections.length === 0) {
    redirect(`/tests/${testId}?error=No+sections+found`);
  }

  const sectionIds = sections.map((s) => s.id);

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_type, points, accepted_answers, section_id")
    .in("section_id", sectionIds)
    .returns<
      {
        id: string;
        question_type: string;
        points: number;
        accepted_answers: string[] | null;
        section_id: string;
      }[]
    >();

  if (!questions) {
    redirect(`/tests/${testId}?error=No+questions+found`);
  }

  const mcTfQuestionIds = questions
    .filter((q) => q.question_type === "multiple_choice" || q.question_type === "true_false")
    .map((q) => q.id);

  let correctOptions: { question_id: string; id: string }[] = [];
  if (mcTfQuestionIds.length > 0) {
    const { data } = await supabase
      .from("answer_options")
      .select("id, question_id")
      .in("question_id", mcTfQuestionIds)
      .eq("is_correct", true)
      .returns<{ id: string; question_id: string }[]>();
    correctOptions = data || [];
  }

  const { data: responses } = await supabase
    .from("responses")
    .select("id, question_id, answer_text, selected_option_id")
    .eq("attempt_id", attemptId)
    .returns<
      {
        id: string;
        question_id: string;
        answer_text: string | null;
        selected_option_id: string | null;
      }[]
    >();

  let totalScore = 0;
  let maxScore = 0;

  for (const question of questions) {
    maxScore += question.points;
    const response = responses?.find((r) => r.question_id === question.id);
    if (!response) continue;

    let isCorrect: boolean | null = null;
    let pointsAwarded = 0;

    if (question.question_type === "multiple_choice" || question.question_type === "true_false") {
      const correct = correctOptions.find((o) => o.question_id === question.id);
      isCorrect = correct ? response.selected_option_id === correct.id : false;
      pointsAwarded = isCorrect ? question.points : 0;
    } else if (question.question_type === "short_answer") {
      const accepted = question.accepted_answers || [];
      const studentAnswer = (response.answer_text || "").trim().toLowerCase();
      isCorrect = accepted.some((a) => a.trim().toLowerCase() === studentAnswer);
      pointsAwarded = isCorrect ? question.points : 0;
    } else if (question.question_type === "essay") {
      isCorrect = null;
      pointsAwarded = 0;
    }

    totalScore += pointsAwarded;

    await supabase
      .from("responses")
      .update({
        is_correct: isCorrect,
        points_awarded: pointsAwarded,
        updated_at: new Date().toISOString(),
      })
      .eq("id", response.id);
  }

  const hasEssay = questions.some((q) => q.question_type === "essay");

  await supabase
    .from("attempts")
    .update({
      status: hasEssay ? "submitted" : "graded",
      submitted_at: new Date().toISOString(),
      score: totalScore,
      max_score: maxScore,
    })
    .eq("id", attemptId);

  revalidatePath(`/tests/${testId}`);
  redirect(`/tests/${testId}/review?attempt=${attemptId}`);
}

export async function gradeEssay(
  attemptId: string,
  responseId: string,
  pointsAwarded: number,
  feedback: string
) {
  const { supabase, user } = await requireUser();

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("responses")
    .update({
      points_awarded: pointsAwarded,
      is_correct: pointsAwarded > 0,
      feedback,
      graded_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", responseId);

  if (error) {
    return { error: error.message };
  }

  // Recalculate attempt score
  const { data: response } = await supabase
    .from("responses")
    .select("attempt_id")
    .eq("id", responseId)
    .single<{ attempt_id: string }>();

  if (response) {
    const { data: allResponses } = await supabase
      .from("responses")
      .select("points_awarded")
      .eq("attempt_id", response.attempt_id)
      .returns<{ points_awarded: number | null }[]>();

    const newScore = (allResponses || []).reduce(
      (sum, r) => sum + (r.points_awarded ?? 0),
      0
    );

    // Check if all responses are graded
    const allGraded = (allResponses || []).every(
      (r) => r.points_awarded !== null
    );

    await supabase
      .from("attempts")
      .update({
        score: newScore,
        status: allGraded ? "graded" : "submitted",
      })
      .eq("id", attemptId);
  }

  revalidatePath(`/admin/grading`);
  return { error: null };
}
