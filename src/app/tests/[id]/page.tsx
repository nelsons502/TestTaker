import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StartTestButton } from "@/components/tests/StartTestButton";

export default async function TestDetailPage(props: {
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

  // Count questions
  const { data: sections } = await supabase
    .from("sections")
    .select("id, title")
    .eq("test_id", params.id)
    .order("sort_order")
    .returns<{ id: string; title: string }[]>();

  const sectionIds = (sections || []).map((s) => s.id);
  let questionCount = 0;
  let totalPoints = 0;
  const sectionCounts: { title: string; count: number }[] = [];

  if (sectionIds.length > 0) {
    const { data: questions } = await supabase
      .from("questions")
      .select("section_id, points")
      .in("section_id", sectionIds)
      .returns<{ section_id: string; points: number }[]>();

    questionCount = questions?.length || 0;
    totalPoints = (questions || []).reduce((sum, q) => sum + q.points, 0);

    for (const section of sections || []) {
      const count = (questions || []).filter(
        (q) => q.section_id === section.id
      ).length;
      sectionCounts.push({ title: section.title, count });
    }
  }

  // Check for existing in-progress attempt
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let inProgressAttempt: { id: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("attempts")
      .select("id")
      .eq("test_id", params.id)
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .single<{ id: string }>();
    inProgressAttempt = data;
  }

  // Past attempts
  const { data: pastAttempts } = await supabase
    .from("attempts")
    .select("id, score, max_score, status, submitted_at")
    .eq("test_id", params.id)
    .eq("user_id", user?.id ?? "")
    .neq("status", "in_progress")
    .order("submitted_at", { ascending: false })
    .limit(5)
    .returns<
      {
        id: string;
        score: number | null;
        max_score: number | null;
        status: string;
        submitted_at: string | null;
      }[]
    >();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/tests"
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Tests
      </Link>

      {searchParams.error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <span className="inline-block rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
          {test.subject}
        </span>
        <h1 className="mt-2 text-2xl font-bold">{test.title}</h1>
        {test.description && (
          <p className="mt-2 text-gray-600">{test.description}</p>
        )}

        <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{questionCount}</p>
            <p className="text-xs text-gray-500">Questions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
            <p className="text-xs text-gray-500">Total Points</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {test.time_limit_minutes ?? "None"}
            </p>
            <p className="text-xs text-gray-500">
              {test.time_limit_minutes ? "Minutes" : "Time Limit"}
            </p>
          </div>
        </div>

        {sectionCounts.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700">Sections</h3>
            <ul className="mt-2 space-y-1">
              {sectionCounts.map((s, i) => (
                <li key={i} className="flex justify-between text-sm text-gray-500">
                  <span>{s.title}</span>
                  <span>
                    {s.count} question{s.count !== 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8">
          <StartTestButton
            testId={test.id}
            inProgressAttemptId={inProgressAttempt?.id ?? null}
          />
        </div>
      </div>

      {/* Past attempts */}
      {pastAttempts && pastAttempts.length > 0 && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Past Attempts</h2>
          <div className="mt-3 space-y-2">
            {pastAttempts.map((attempt) => (
              <Link
                key={attempt.id}
                href={`/tests/${params.id}/review?attempt=${attempt.id}`}
                className="flex items-center justify-between rounded-md border border-gray-100 p-3 hover:bg-gray-50"
              >
                <div className="text-sm">
                  <span className="font-medium">
                    {attempt.score ?? 0}/{attempt.max_score ?? 0}
                  </span>
                  <span className="ml-2 text-gray-500">
                    (
                    {attempt.max_score
                      ? Math.round(
                          ((attempt.score ?? 0) / attempt.max_score) * 100
                        )
                      : 0}
                    %)
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {attempt.submitted_at
                    ? new Date(attempt.submitted_at).toLocaleDateString()
                    : ""}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
