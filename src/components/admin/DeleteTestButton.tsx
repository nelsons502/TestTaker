"use client";

import { deleteTest } from "@/app/actions/tests";

export function DeleteTestButton({
  testId,
  testTitle,
}: {
  testId: string;
  testTitle: string;
}) {
  return (
    <button
      onClick={async () => {
        if (confirm(`Delete "${testTitle}"? This cannot be undone.`)) {
          await deleteTest(testId);
        }
      }}
      className="text-sm text-red-600 hover:text-red-800"
    >
      Delete
    </button>
  );
}
