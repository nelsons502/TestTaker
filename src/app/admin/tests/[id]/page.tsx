import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TestEditForm } from "@/components/admin/TestEditForm";
import { SectionManager } from "@/components/admin/SectionManager";

export default async function EditTestPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const { data: test } = await supabase
    .from("tests")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!test) notFound();

  // Fetch students for assignment dropdown
  const { data: studentProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "student")
    .order("full_name")
    .returns<{ id: string; full_name: string | null }[]>();

  const { data: sections } = await supabase
    .from("sections")
    .select("*")
    .eq("test_id", params.id)
    .order("sort_order");

  // Fetch questions with answer options for each section
  const sectionIds = (sections || []).map((s) => s.id);
  let questions: Array<{
    id: string;
    section_id: string;
    question_type: "multiple_choice" | "true_false" | "short_answer" | "essay";
    content: string;
    explanation: string | null;
    points: number;
    sort_order: number;
    accepted_answers: string[] | null;
    created_at: string;
  }> = [];
  let answerOptions: Array<{
    id: string;
    question_id: string;
    content: string;
    is_correct: boolean;
    sort_order: number;
  }> = [];

  if (sectionIds.length > 0) {
    const { data: q } = await supabase
      .from("questions")
      .select("*")
      .in("section_id", sectionIds)
      .order("sort_order");
    questions = q || [];

    const questionIds = questions.map((q) => q.id);
    if (questionIds.length > 0) {
      const { data: opts } = await supabase
        .from("answer_options")
        .select("*")
        .in("question_id", questionIds)
        .order("sort_order");
      answerOptions = opts || [];
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {searchParams.error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      <TestEditForm test={test} students={studentProfiles || []} />

      <div className="mt-8">
        <SectionManager
          testId={test.id}
          sections={sections || []}
          questions={questions}
          answerOptions={answerOptions}
        />
      </div>
    </div>
  );
}
