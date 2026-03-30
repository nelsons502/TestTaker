"use client";

import { startAttempt } from "@/app/actions/attempts";

export function StartTestButton({
  testId,
  inProgressAttemptId,
}: {
  testId: string;
  inProgressAttemptId: string | null;
}) {
  if (inProgressAttemptId) {
    return (
      <div className="flex gap-3">
        <a
          href={`/${testId}/take?attempt=${inProgressAttemptId}`}
          className="rounded-md bg-orange-500 px-6 py-3 text-sm font-medium text-white hover:bg-orange-600"
        >
          Resume Test
        </a>
        <button
          onClick={async () => {
            await startAttempt(testId);
          }}
          className="rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Start New Attempt
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={async () => {
        await startAttempt(testId);
      }}
      className="rounded-md bg-orange-500 px-6 py-3 text-sm font-medium text-white hover:bg-orange-600"
    >
      Start Test
    </button>
  );
}
