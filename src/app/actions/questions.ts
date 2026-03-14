"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

export async function createQuestion(testId: string, sectionId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const questionType = formData.get("question_type") as string;

  // Get next sort order
  const { data: existing } = await supabase
    .from("questions")
    .select("sort_order")
    .eq("section_id", sectionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .returns<{ sort_order: number }[]>();

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  // Build accepted_answers for short_answer
  let acceptedAnswers: string[] | null = null;
  if (questionType === "short_answer") {
    const raw = formData.get("accepted_answers") as string;
    if (raw) {
      acceptedAnswers = raw
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean);
    }
  }

  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      section_id: sectionId,
      question_type: questionType as "multiple_choice" | "true_false" | "short_answer" | "essay",
      content: formData.get("content") as string,
      explanation: (formData.get("explanation") as string) || null,
      points: Number(formData.get("points") || 1),
      sort_order: nextOrder,
      accepted_answers: acceptedAnswers,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    redirect(`/admin/tests/${testId}?error=${encodeURIComponent(error.message)}`);
  }

  // Handle answer options for MC and TF
  if (questionType === "multiple_choice") {
    const optionCount = Number(formData.get("option_count") || 0);
    const options = [];
    for (let i = 0; i < optionCount; i++) {
      const content = formData.get(`option_${i}_content`) as string;
      const isCorrect = formData.get("correct_option") === String(i);
      if (content) {
        options.push({
          question_id: question.id,
          content,
          is_correct: isCorrect,
          sort_order: i,
        });
      }
    }
    if (options.length > 0) {
      await supabase.from("answer_options").insert(options);
    }
  } else if (questionType === "true_false") {
    const correctAnswer = formData.get("correct_option") as string;
    await supabase.from("answer_options").insert([
      {
        question_id: question.id,
        content: "True",
        is_correct: correctAnswer === "true",
        sort_order: 0,
      },
      {
        question_id: question.id,
        content: "False",
        is_correct: correctAnswer === "false",
        sort_order: 1,
      },
    ]);
  }

  revalidatePath(`/admin/tests/${testId}`);
}

export async function updateQuestion(testId: string, questionId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const questionType = formData.get("question_type") as string;

  let acceptedAnswers: string[] | null = null;
  if (questionType === "short_answer") {
    const raw = formData.get("accepted_answers") as string;
    if (raw) {
      acceptedAnswers = raw
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean);
    }
  }

  const { error } = await supabase
    .from("questions")
    .update({
      content: formData.get("content") as string,
      explanation: (formData.get("explanation") as string) || null,
      points: Number(formData.get("points") || 1),
      accepted_answers: acceptedAnswers,
    })
    .eq("id", questionId);

  if (error) {
    redirect(`/admin/tests/${testId}?error=${encodeURIComponent(error.message)}`);
  }

  // Update answer options for MC and TF
  if (questionType === "multiple_choice") {
    // Delete existing options and re-create
    await supabase.from("answer_options").delete().eq("question_id", questionId);

    const optionCount = Number(formData.get("option_count") || 0);
    const options = [];
    for (let i = 0; i < optionCount; i++) {
      const content = formData.get(`option_${i}_content`) as string;
      const isCorrect = formData.get("correct_option") === String(i);
      if (content) {
        options.push({
          question_id: questionId,
          content,
          is_correct: isCorrect,
          sort_order: i,
        });
      }
    }
    if (options.length > 0) {
      await supabase.from("answer_options").insert(options);
    }
  } else if (questionType === "true_false") {
    await supabase.from("answer_options").delete().eq("question_id", questionId);
    const correctAnswer = formData.get("correct_option") as string;
    await supabase.from("answer_options").insert([
      {
        question_id: questionId,
        content: "True",
        is_correct: correctAnswer === "true",
        sort_order: 0,
      },
      {
        question_id: questionId,
        content: "False",
        is_correct: correctAnswer === "false",
        sort_order: 1,
      },
    ]);
  }

  revalidatePath(`/admin/tests/${testId}`);
}

export async function deleteQuestion(testId: string, questionId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId);

  if (error) {
    redirect(`/admin/tests/${testId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/admin/tests/${testId}`);
}

export async function reorderQuestion(
  testId: string,
  questionId: string,
  sectionId: string,
  direction: "up" | "down"
) {
  const { supabase } = await requireAdmin();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, sort_order")
    .eq("section_id", sectionId)
    .order("sort_order")
    .returns<{ id: string; sort_order: number }[]>();

  if (!questions) return;

  const idx = questions.findIndex((q) => q.id === questionId);
  if (idx === -1) return;
  if (direction === "up" && idx === 0) return;
  if (direction === "down" && idx === questions.length - 1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  const currentOrder = questions[idx].sort_order;
  const swapOrder = questions[swapIdx].sort_order;

  await supabase
    .from("questions")
    .update({ sort_order: swapOrder })
    .eq("id", questionId);

  await supabase
    .from("questions")
    .update({ sort_order: currentOrder })
    .eq("id", questions[swapIdx].id);

  revalidatePath(`/admin/tests/${testId}`);
}
