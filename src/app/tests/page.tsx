import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function TestBrowserPage(props: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  // RLS policy already handles filtering (public OR assigned_to = user),
  // so we just select all visible tests
  let query = supabase
    .from("tests")
    .select(
      "id, title, description, subject, time_limit_minutes, is_public, assigned_to"
    )
    .order("subject")
    .order("title");

  if (searchParams.subject) {
    query = query.eq("subject", searchParams.subject);
  }

  const { data: tests } = await query.returns<
    {
      id: string;
      title: string;
      description: string | null;
      subject: string;
      time_limit_minutes: number | null;
      is_public: boolean;
      assigned_to: string | null;
    }[]
  >();

  // Get distinct subjects for filter from all visible tests
  const { data: allTests } = await supabase
    .from("tests")
    .select("subject")
    .returns<{ subject: string }[]>();

  const subjects = [...new Set((allTests || []).map((t) => t.subject))].sort();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Practice Tests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose a test to start practicing
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Subject filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/tests"
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            !searchParams.subject
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        {subjects.map((subject) => (
          <Link
            key={subject}
            href={`/tests?subject=${encodeURIComponent(subject)}`}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              searchParams.subject === subject
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {subject}
          </Link>
        ))}
      </div>

      {/* Test list */}
      {!tests || tests.length === 0 ? (
        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No tests available yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {tests.map((test) => (
            <Link
              key={test.id}
              href={`/tests/${test.id}`}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-semibold text-gray-900">{test.title}</h2>
                {test.assigned_to === user.id && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Assigned
                  </span>
                )}
              </div>
              <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {test.subject}
              </span>
              {test.description && (
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                  {test.description}
                </p>
              )}
              <div className="mt-3 text-xs text-gray-400">
                {test.time_limit_minutes
                  ? `${test.time_limit_minutes} minutes`
                  : "No time limit"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
