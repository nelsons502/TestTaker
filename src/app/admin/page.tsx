import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Count tests
  const { count: testCount } = await supabase
    .from("tests")
    .select("id", { count: "exact", head: true });

  // Count students
  const { count: studentCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "student");

  // Recent attempts (all students)
  const { data: recentAttempts } = await supabase
    .from("attempts")
    .select("id, test_id, user_id, score, max_score, status, submitted_at")
    .neq("status", "in_progress")
    .order("submitted_at", { ascending: false })
    .limit(10)
    .returns<
      {
        id: string;
        test_id: string;
        user_id: string;
        score: number | null;
        max_score: number | null;
        status: string;
        submitted_at: string | null;
      }[]
    >();

  // Get test titles and student names
  const testIds = [...new Set((recentAttempts || []).map((a) => a.test_id))];
  const userIds = [...new Set((recentAttempts || []).map((a) => a.user_id))];

  let testMap = new Map<string, string>();
  if (testIds.length > 0) {
    const { data } = await supabase
      .from("tests")
      .select("id, title")
      .in("id", testIds)
      .returns<{ id: string; title: string }[]>();
    testMap = new Map((data || []).map((t) => [t.id, t.title]));
  }

  let userMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds)
      .returns<{ id: string; full_name: string | null }[]>();
    userMap = new Map(
      (data || []).map((u) => [u.id, u.full_name || "Unknown"])
    );
  }

  // Essays pending review
  const { data: pendingEssays } = await supabase
    .from("responses")
    .select("id, attempt_id, question_id")
    .is("graded_by", null)
    .not("answer_text", "is", null)
    .limit(1)
    .returns<{ id: string; attempt_id: string; question_id: string }[]>();

  // Check if the pending essays are actually essay questions
  let essaysPendingCount = 0;
  if (pendingEssays && pendingEssays.length > 0) {
    const { count } = await supabase
      .from("responses")
      .select("responses.id, questions!inner(question_type)", {
        count: "exact",
        head: true,
      })
      .is("graded_by", null)
      .not("answer_text", "is", null);
    essaysPendingCount = count ?? 0;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Tests</p>
          <p className="mt-1 text-3xl font-bold">{testCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Students</p>
          <p className="mt-1 text-3xl font-bold">{studentCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Completed Attempts</p>
          <p className="mt-1 text-3xl font-bold">
            {(recentAttempts || []).length}
          </p>
        </div>
        <Link
          href="/admin/grading"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-orange-400 hover:shadow"
        >
          <p className="text-sm text-gray-500">Essays to Grade</p>
          <p className="mt-1 text-3xl font-bold text-orange-600">
            {essaysPendingCount}
          </p>
        </Link>
      </div>

      {/* Quick links */}
      <div className="mt-6 flex gap-3">
        <Link
          href="/admin/tests"
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Manage Tests
        </Link>
        <Link
          href="/admin/grading"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Grade Essays
        </Link>
      </div>

      {/* Recent attempts */}
      <h2 className="mt-8 text-lg font-semibold">Recent Student Attempts</h2>
      {!recentAttempts || recentAttempts.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No attempts yet.</p>
      ) : (
        <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Test
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentAttempts.map((a) => {
                const pct =
                  a.max_score && a.max_score > 0
                    ? Math.round(((a.score ?? 0) / a.max_score) * 100)
                    : 0;
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3 text-sm">
                      {userMap.get(a.user_id) ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {testMap.get(a.test_id) ?? "Test"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium ${
                          pct >= 70
                            ? "text-green-600"
                            : pct >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.status === "graded"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {a.submitted_at
                        ? new Date(a.submitted_at).toLocaleDateString()
                        : "\u2014"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
