"use client";

import { updateTest, deleteTest } from "@/app/actions/tests";
import type { Database } from "@/types/database";

type Test = Database["public"]["Tables"]["tests"]["Row"];
type Student = { id: string; full_name: string | null };

export function TestEditForm({
  test,
  students,
}: {
  test: Test;
  students: Student[];
}) {
  const updateTestWithId = updateTest.bind(null, test.id);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Test</h1>
        <button
          onClick={async () => {
            if (confirm(`Delete "${test.title}"? This cannot be undone.`)) {
              await deleteTest(test.id);
            }
          }}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Delete Test
        </button>
      </div>

      <form action={updateTestWithId} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={test.title}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
              defaultValue={test.subject}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
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
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={test.description ?? ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-end gap-4">
          <div>
            <label
              htmlFor="time_limit_minutes"
              className="block text-sm font-medium text-gray-700"
            >
              Time Limit (minutes)
            </label>
            <input
              id="time_limit_minutes"
              name="time_limit_minutes"
              type="number"
              min={1}
              defaultValue={test.time_limit_minutes ?? ""}
              className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 pb-2">
            <input
              id="is_public"
              name="is_public"
              type="checkbox"
              defaultChecked={test.is_public}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="is_public" className="text-sm font-medium text-gray-700">
              Public
            </label>
          </div>

          <div>
            <label
              htmlFor="assigned_to"
              className="block text-sm font-medium text-gray-700"
            >
              Assign to Student
            </label>
            <select
              id="assigned_to"
              name="assigned_to"
              defaultValue={test.assigned_to ?? ""}
              className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">Anyone (public)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
