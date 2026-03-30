import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TestTakingUI } from "@/components/tests/TestTakingUI";

export default async function TakeTestPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  if (!searchParams.attempt) {
    redirect(`/${params.id}`);
  }

  const attemptId = searchParams.attempt;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: attempt } = await supabase
    .from("attempts")
    .select("id, status, started_at, test_id, question_order, option_order")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (!attempt) notFound();
  if (attempt.status !== "in_progress") {
    redirect(`/${params.id}/review?attempt=${attemptId}`);
  }

  const { data: test } = await supabase
    .from("tests")
    .select("id, title, time_limit_minutes")
    .eq("id", params.id)
    .single<{ id: string; title: string; time_limit_minutes: number | null }>();

  if (!test) notFound();

  const { data: sections } = await supabase
    .from("sections")
    .select("id, title, sort_order")
    .eq("test_id", params.id)
    .order("sort_order")
    .returns<{ id: string; title: string; sort_order: number }[]>();

  const sectionIds = (sections || []).map((s) => s.id);

  const { data: questions } = await supabase
    .from("questions")
    .select("id, section_id, question_type, content, points, sort_order")
    .in("section_id", sectionIds)
    .order("sort_order")
    .returns<
      {
        id: string;
        section_id: string;
        question_type: string;
        content: string;
        points: number;
        sort_order: number;
      }[]
    >();

  const questionIds = (questions || []).map((q) => q.id);
  let answerOptions: {
    id: string;
    question_id: string;
    content: string;
    sort_order: number;
  }[] = [];

  if (questionIds.length > 0) {
    const { data } = await supabase
      .from("answer_options")
      .select("id, question_id, content, sort_order")
      .in("question_id", questionIds)
      .order("sort_order")
      .returns<
        { id: string; question_id: string; content: string; sort_order: number }[]
      >();
    answerOptions = data || [];
  }

  const { data: existingResponses } = await supabase
    .from("responses")
    .select("question_id, answer_text, selected_option_id")
    .eq("attempt_id", attemptId)
    .returns<
      {
        question_id: string;
        answer_text: string | null;
        selected_option_id: string | null;
      }[]
    >();

  // Use randomized order from attempt if available, otherwise fall back to sort_order
  const questionOrder = attempt.question_order as string[] | null;
  const optionOrderMap = attempt.option_order as Record<string, string[]> | null;

  // Build section lookup
  const sectionMap = new Map((sections || []).map((s) => [s.id, s.title]));
  const questionMap = new Map((questions || []).map((q) => [q.id, q]));

  let orderedQuestions;
  if (questionOrder && questionOrder.length > 0) {
    // Use stored randomized order
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
        };
      });
  } else {
    // Fallback: original order
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
        }))
    );
  }

  let deadlineISO: string | null = null;
  if (test.time_limit_minutes) {
    const startedAt = new Date(attempt.started_at);
    const deadline = new Date(
      startedAt.getTime() + test.time_limit_minutes * 60 * 1000
    );
    deadlineISO = deadline.toISOString();
  }

  return (
    <TestTakingUI
      testId={test.id}
      testTitle={test.title}
      attemptId={attemptId}
      questions={orderedQuestions}
      existingResponses={existingResponses || []}
      deadlineISO={deadlineISO}
    />
  );
}
