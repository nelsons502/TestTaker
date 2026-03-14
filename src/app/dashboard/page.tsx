import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single<{ role: string; full_name: string | null }>();

  // Recent attempts
  const { data: recentAttempts } = await supabase
    .from("attempts")
    .select("id, test_id, score, max_score, status, submitted_at, started_at")
    .eq("user_id", user.id)
    .neq("status", "in_progress")
    .order("submitted_at", { ascending: false })
    .limit(10)
    .returns<
      {
        id: string;
        test_id: string;
        score: number | null;
        max_score: number | null;
        status: string;
        submitted_at: string | null;
        started_at: string;
      }[]
    >();

  // Get test titles for recent attempts
  const testIds = [...new Set((recentAttempts || []).map((a) => a.test_id))];
  let testMap = new Map<string, { title: string; subject: string }>();
  if (testIds.length > 0) {
    const { data: tests } = await supabase
      .from("tests")
      .select("id, title, subject")
      .in("id", testIds)
      .returns<{ id: string; title: string; subject: string }[]>();
    testMap = new Map((tests || []).map((t) => [t.id, { title: t.title, subject: t.subject }]));
  }

  // In-progress attempts
  const { data: inProgress } = await supabase
    .from("attempts")
    .select("id, test_id, started_at")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .returns<{ id: string; test_id: string; started_at: string }[]>();

  // Get test info for in-progress
  const ipTestIds = [...new Set((inProgress || []).map((a) => a.test_id))];
  if (ipTestIds.length > 0) {
    const { data: tests } = await supabase
      .from("tests")
      .select("id, title, subject")
      .in("id", ipTestIds)
      .returns<{ id: string; title: string; subject: string }[]>();
    for (const t of tests || []) {
      if (!testMap.has(t.id)) {
        testMap.set(t.id, { title: t.title, subject: t.subject });
      }
    }
  }

  // Calculate stats
  const completedAttempts = recentAttempts || [];
  const avgScore =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((sum, a) => {
            if (a.max_score && a.max_score > 0) {
              return sum + ((a.score ?? 0) / a.max_score) * 100;
            }
            return sum;
          }, 0) / completedAttempts.length
        )
      : null;

  // Suggested retakes: tests where latest score < 70%
  const latestByTest = new Map<string, typeof completedAttempts[0]>();
  for (const a of completedAttempts) {
    if (!latestByTest.has(a.test_id)) {
      latestByTest.set(a.test_id, a);
    }
  }
  const suggestedRetakes = Array.from(latestByTest.values()).filter((a) => {
    if (!a.max_score || a.max_score === 0) return false;
    return ((a.score ?? 0) / a.max_score) * 100 < 70;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Your practice test dashboard</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/tests"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse Tests
          </Link>
          {profile?.role === "admin" && (
            <Link
              href="/admin/tests"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Admin
            </Link>
          )}
          <form action="/auth/sign-out" method="POST">
            <button
              type="submit"
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Tests Completed</p>
          <p className="mt-1 text-3xl font-bold">{completedAttempts.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Average Score</p>
          <p className="mt-1 text-3xl font-bold">
            {avgScore !== null ? `${avgScore}%` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="mt-1 text-3xl font-bold">
            {(inProgress || []).length}
          </p>
        </div>
      </div>

      {/* In-progress attempts */}
      {inProgress && inProgress.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Resume Test</h2>
          <div className="mt-2 space-y-2">
            {inProgress.map((a) => {
              const testInfo = testMap.get(a.test_id);
              return (
                <Link
                  key={a.id}
                  href={`/tests/${a.test_id}/take?attempt=${a.id}`}
                  className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-4 hover:bg-yellow-100"
                >
                  <div>
                    <p className="font-medium">{testInfo?.title ?? "Test"}</p>
                    <p className="text-xs text-gray-500">
                      Started {new Date(a.started_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-md bg-yellow-200 px-3 py-1 text-sm font-medium text-yellow-800">
                    Resume
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested retakes */}
      {suggestedRetakes.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Suggested Retakes</h2>
          <p className="text-sm text-gray-500">
            Tests where you scored below 70%
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {suggestedRetakes.map((a) => {
              const testInfo = testMap.get(a.test_id);
              const pct = a.max_score
                ? Math.round(((a.score ?? 0) / a.max_score) * 100)
                : 0;
              return (
                <Link
                  key={a.test_id}
                  href={`/tests/${a.test_id}`}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-400 hover:shadow"
                >
                  <p className="font-medium">{testInfo?.title ?? "Test"}</p>
                  <p className="text-sm text-gray-500">
                    Last score:{" "}
                    <span className="font-medium text-red-600">{pct}%</span>
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent attempts */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold">Recent Attempts</h2>
        {completedAttempts.length === 0 ? (
          <div className="mt-2 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">
              No completed tests yet.{" "}
              <Link href="/tests" className="text-blue-600 hover:underline">
                Browse tests
              </Link>{" "}
              to get started.
            </p>
          </div>
        ) : (
          <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Test
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {completedAttempts.map((a) => {
                  const testInfo = testMap.get(a.test_id);
                  const pct = a.max_score
                    ? Math.round(((a.score ?? 0) / a.max_score) * 100)
                    : 0;
                  return (
                    <tr key={a.id}>
                      <td className="px-4 py-3 text-sm font-medium">
                        {testInfo?.title ?? "Test"}
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
                        <span className="ml-1 text-xs text-gray-400">
                          ({a.score ?? 0}/{a.max_score ?? 0})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {a.submitted_at
                          ? new Date(a.submitted_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/tests/${a.test_id}/review?attempt=${a.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
