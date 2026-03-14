import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteTestButton } from "@/components/admin/DeleteTestButton";

export default async function AdminTestsPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const { data: tests } = await supabase
    .from("tests")
    .select("id, title, subject, is_public, created_at, time_limit_minutes")
    .order("created_at", { ascending: false })
    .returns<{ id: string; title: string; subject: string; is_public: boolean; created_at: string; time_limit_minutes: number | null }[]>();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tests</h1>
        <Link
          href="/admin/tests/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Test
        </Link>
      </div>

      {searchParams.error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      {!tests || tests.length === 0 ? (
        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No tests yet. Create your first test to get started.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Time Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tests.map((test) => (
                <tr key={test.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/tests/${test.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {test.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {test.subject}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {test.time_limit_minutes
                      ? `${test.time_limit_minutes} min`
                      : "None"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        test.is_public
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {test.is_public ? "Public" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/tests/${test.id}`}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Link>
                      <DeleteTestButton testId={test.id} testTitle={test.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
