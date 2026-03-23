import { createTest } from "@/app/actions/tests";
import { createClient } from "@/lib/supabase/server";

export default async function NewTestPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "student")
    .order("full_name")
    .returns<{ id: string; full_name: string | null }[]>();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Create New Test</h1>

      {searchParams.error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      <form action={createTest} className="mt-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="e.g., GED Math Practice Test 1"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">Select a subject...</option>
            <option value="GED Math">GED Math</option>
            <option value="GED Language Arts">GED Language Arts</option>
            <option value="GED Science">GED Science</option>
            <option value="GED Social Studies">GED Social Studies</option>
            <option value="ACT English">ACT English</option>
            <option value="ACT Math">ACT Math</option>
            <option value="ACT Reading">ACT Reading</option>
            <option value="ACT Science">ACT Science</option>
            <option value="SAT Reading & Writing">SAT Reading & Writing</option>
            <option value="SAT Math">SAT Math</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="Describe what this test covers..."
          />
        </div>

        <div>
          <label htmlFor="time_limit_minutes" className="block text-sm font-medium text-gray-700">
            Time Limit (minutes)
          </label>
          <input
            id="time_limit_minutes"
            name="time_limit_minutes"
            type="number"
            min={1}
            className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="Leave blank for no limit"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_public"
            name="is_public"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="is_public" className="text-sm font-medium text-gray-700">
            Make this test public (visible to students)
          </label>
        </div>

        <div>
          <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
            Assign to Student (optional)
          </label>
          <select
            id="assigned_to"
            name="assigned_to"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">No specific student</option>
            {(students || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name || s.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Create Test
          </button>
          <a
            href="/tests/admin/tests"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
