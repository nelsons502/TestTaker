import { describe, it, expect, vi, beforeEach } from "vitest";
import { startAttempt, saveResponse, submitAttempt, gradeEssay } from "../attempts";
import { createMockSupabaseClient } from "./helpers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT: ${url}`);
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("attempts actions", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe("startAttempt", () => {
    it("should redirect to take page when an in-progress attempt exists", async () => {
      mockSupabase.getChain("attempts").single.mockResolvedValueOnce({
        data: { id: "attempt-123" },
      });

      await expect(startAttempt("test-1")).rejects.toThrow("REDIRECT: /test-1/take?attempt=attempt-123");
    });

    it("should redirect to take page with new attempt on success", async () => {
      mockSupabase.getChain("attempts").single.mockResolvedValueOnce({ data: null }); // no existing
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({ data: [] });
      mockSupabase.getChain("attempts").single.mockResolvedValueOnce({ data: { id: "new-attempt" }, error: null }); // insert result

      await expect(startAttempt("test-1")).rejects.toThrow("REDIRECT: /test-1/take?attempt=new-attempt");
    });

    it("should create a new attempt with shuffled question_order and option_order only for mc/tf", async () => {
      mockSupabase.getChain("attempts").single.mockResolvedValueOnce({ data: null }); // no existing
      
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({
        data: [{ id: "sec-1" }, { id: "sec-2" }],
      });

      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({
        data: [
          { id: "q-1", section_id: "sec-1", question_type: "short_answer", sort_order: 0 },
          { id: "q-2", section_id: "sec-1", question_type: "multiple_choice", sort_order: 1 },
          { id: "q-3", section_id: "sec-2", question_type: "essay", sort_order: 0 },
        ],
      });

      mockSupabase.getChain("answer_options").returns.mockResolvedValueOnce({
        data: [
          { id: "opt-1", question_id: "q-2" },
          { id: "opt-2", question_id: "q-2" },
        ],
      });

      mockSupabase.getChain("attempts").single.mockResolvedValueOnce({
        data: { id: "new-attempt" },
        error: null,
      });

      await expect(startAttempt("test-1")).rejects.toThrow("REDIRECT: /test-1/take?attempt=new-attempt");

      const insertCall = mockSupabase.getChain("attempts").insert.mock.calls[0][0];
      
      // Questions from sec-1 should be before sec-2
      expect(insertCall.question_order.slice(0, 2).sort()).toEqual(["q-1", "q-2"]);
      expect(insertCall.question_order[2]).toBe("q-3");

      // Option order only for mc/tf
      expect(insertCall.option_order).toHaveProperty("q-2");
      expect(insertCall.option_order["q-2"].sort()).toEqual(["opt-1", "opt-2"]);
      expect(insertCall.option_order).not.toHaveProperty("q-1");
      expect(insertCall.option_order).not.toHaveProperty("q-3");
    });

    it("should redirect to test detail page with error query param on insert error", async () => {
      mockSupabase.getChain("attempts").single.mockResolvedValueOnce({ data: null }); // no existing
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({ data: [] });
      
      mockSupabase.getChain("attempts").single.mockResolvedValueOnce({
        data: null,
        error: { message: "Failed to create" },
      });

      await expect(startAttempt("test-1")).rejects.toThrow("REDIRECT: /test-1?error=Failed%20to%20create");
    });
  });

  describe("saveResponse", () => {
    it("should upsert with correct conflict key and correct field mapping", async () => {
      mockSupabase.getChain("responses").resolveNextThen({ error: null });

      const result = await saveResponse("attempt-1", "q-1", { answer_text: "hello" });

      expect(mockSupabase.getChain("responses").upsert).toHaveBeenCalledWith(
        {
          attempt_id: "attempt-1",
          question_id: "q-1",
          answer_text: "hello",
          selected_option_id: null,
        },
        { onConflict: "attempt_id,question_id" }
      );
      expect(result).toEqual({ error: null });
    });

    it("should return { error: null } on success", async () => {
      mockSupabase.getChain("responses").resolveNextThen({ error: null });
      const result = await saveResponse("a", "q", { selected_option_id: "opt-1" });
      expect(result.error).toBeNull();
    });

    it("should return { error: 'message' } on Supabase error", async () => {
      mockSupabase.getChain("responses").resolveNextThen({ error: { message: "db error" } });
      const result = await saveResponse("a", "q", {});
      expect(result.error).toBe("db error");
    });
  });

  describe("submitAttempt", () => {
    it("should grade multiple choice correctly and update responses", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-02T12:00:00Z"));

      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({ data: [{ id: "sec-1" }] });
      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({
        data: [
          { id: "q-1", question_type: "multiple_choice", points: 5, section_id: "sec-1" },
          { id: "q-2", question_type: "multiple_choice", points: 5, section_id: "sec-1" },
        ],
      });
      mockSupabase.getChain("answer_options").returns.mockResolvedValueOnce({
        data: [{ id: "opt-correct", question_id: "q-1" }, { id: "opt-correct-2", question_id: "q-2" }],
      });
      mockSupabase.getChain("responses").returns.mockResolvedValueOnce({
        data: [
          { id: "res-1", question_id: "q-1", selected_option_id: "opt-correct" }, // Correct
          { id: "res-2", question_id: "q-2", selected_option_id: "opt-wrong" }, // Incorrect
        ],
      });

      await expect(submitAttempt("test-1", "attempt-1")).rejects.toThrow("REDIRECT: /test-1/review?attempt=attempt-1");

      expect(mockSupabase.getChain("responses").update).toHaveBeenCalledWith(
        expect.objectContaining({ is_correct: true, points_awarded: 5, updated_at: "2026-04-02T12:00:00.000Z" })
      );
      expect(mockSupabase.getChain("responses").update).toHaveBeenCalledWith(
        expect.objectContaining({ is_correct: false, points_awarded: 0 })
      );
      
      expect(mockSupabase.getChain("attempts").update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "graded", score: 5, max_score: 10 })
      );

      vi.useRealTimers();
    });

    it("should grade short answer case-insensitively and update individually", async () => {
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({ data: [{ id: "sec-1" }] });
      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({
        data: [
          { id: "q-1", question_type: "short_answer", points: 5, accepted_answers: ["Hello World"], section_id: "sec-1" },
          { id: "q-2", question_type: "short_answer", points: 5, accepted_answers: ["Correct"], section_id: "sec-1" },
        ],
      });
      // No MC questions, so answer_options not called
      mockSupabase.getChain("responses").returns.mockResolvedValueOnce({
        data: [
          { id: "res-1", question_id: "q-1", answer_text: "  hello world  " }, // Correct match
          { id: "res-2", question_id: "q-2", answer_text: "wrong" }, // Incorrect
        ],
      });

      await expect(submitAttempt("test-1", "attempt-1")).rejects.toThrow("REDIRECT: /test-1/review?attempt=attempt-1");

      expect(mockSupabase.getChain("responses").update).toHaveBeenCalledTimes(2);
      expect(mockSupabase.getChain("attempts").update).toHaveBeenCalledWith(
        expect.objectContaining({ score: 5, max_score: 10, status: "graded" })
      );
    });

    it("should handle essay correctly (is_correct null, 0 points) and set status to submitted", async () => {
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({ data: [{ id: "sec-1" }] });
      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({
        data: [
          { id: "q-1", question_type: "essay", points: 10, section_id: "sec-1" },
        ],
      });
      mockSupabase.getChain("responses").returns.mockResolvedValueOnce({
        data: [
          { id: "res-1", question_id: "q-1", answer_text: "Long essay" },
        ],
      });

      await expect(submitAttempt("test-1", "attempt-1")).rejects.toThrow("REDIRECT: /test-1/review?attempt=attempt-1");

      expect(mockSupabase.getChain("responses").update).toHaveBeenCalledWith(
        expect.objectContaining({ is_correct: null, points_awarded: 0 })
      );
      
      expect(mockSupabase.getChain("attempts").update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "submitted", score: 0, max_score: 10 })
      );
    });

    it("should calculate total score and max score correctly", async () => {
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({ data: [{ id: "sec-1" }] });
      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({
        data: [
          { id: "q-1", question_type: "short_answer", points: 3, accepted_answers: ["a"], section_id: "sec-1" },
          { id: "q-2", question_type: "short_answer", points: 7, accepted_answers: ["b"], section_id: "sec-1" },
        ],
      });
      mockSupabase.getChain("responses").returns.mockResolvedValueOnce({
        data: [
          { id: "res-1", question_id: "q-1", answer_text: "a" },
          { id: "res-2", question_id: "q-2", answer_text: "b" },
        ],
      });

      await expect(submitAttempt("test-1", "attempt-1")).rejects.toThrow("REDIRECT: /test-1/review?attempt=attempt-1");

      expect(mockSupabase.getChain("attempts").update).toHaveBeenCalledWith(
        expect.objectContaining({ score: 10, max_score: 10 })
      );
    });

    it("should redirect to error if no sections found", async () => {
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({ data: [] });
      await expect(submitAttempt("test-1", "attempt-1")).rejects.toThrow("REDIRECT: /test-1?error=No+sections+found");
    });
    
    it("should redirect to error if no questions found", async () => {
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({ data: [{ id: "sec-1" }] });
      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({ data: null });
      await expect(submitAttempt("test-1", "attempt-1")).rejects.toThrow("REDIRECT: /test-1?error=No+questions+found");
    });

    it("should revalidate the test page after submission", async () => {
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({ data: [{ id: "sec-1" }] });
      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({ data: [] });
      mockSupabase.getChain("responses").returns.mockResolvedValueOnce({ data: [] });

      await expect(submitAttempt("test-1", "attempt-1")).rejects.toThrow("REDIRECT: /test-1/review?attempt=attempt-1");

      expect(revalidatePath).toHaveBeenCalledWith("/test-1");
    });
  });

  describe("gradeEssay", () => {
    it("should return Unauthorized for non-admin users", async () => {
      mockSupabase.getChain("profiles").single.mockResolvedValueOnce({ data: { role: "student" } });

      const result = await gradeEssay("attempt-1", "res-1", 10, "Good");

      expect(result).toEqual({ error: "Unauthorized" });
      expect(mockSupabase.getChain("responses").update).not.toHaveBeenCalled();
    });

    it("should update response with points_awarded, is_correct, feedback, and graded_by", async () => {
      mockSupabase.getChain("profiles").single.mockResolvedValueOnce({ data: { role: "admin" } });
      mockSupabase.getChain("responses").resolveNextThen({ error: null });
      
      // Recalculate attempt score
      mockSupabase.getChain("responses").single.mockResolvedValueOnce({ data: { attempt_id: "attempt-1" } });
      mockSupabase.getChain("responses").returns.mockResolvedValueOnce({
        data: [{ points_awarded: 10 }],
      });

      await gradeEssay("attempt-1", "res-1", 10, "Great job!");

      expect(mockSupabase.getChain("responses").update).toHaveBeenCalledWith(
        expect.objectContaining({
          points_awarded: 10,
          is_correct: true,
          feedback: "Great job!",
          graded_by: "test-user", // from auth mock
        })
      );
    });

    it("should set is_correct to false if points_awarded is 0", async () => {
      mockSupabase.getChain("profiles").single.mockResolvedValueOnce({ data: { role: "admin" } });
      mockSupabase.getChain("responses").resolveNextThen({ error: null });
      
      // Recalculate attempt score
      mockSupabase.getChain("responses").single.mockResolvedValueOnce({ data: { attempt_id: "attempt-1" } });
      mockSupabase.getChain("responses").returns.mockResolvedValueOnce({
        data: [{ points_awarded: 0 }],
      });

      await gradeEssay("attempt-1", "res-1", 0, "Poor");

      expect(mockSupabase.getChain("responses").update).toHaveBeenCalledWith(
        expect.objectContaining({
          points_awarded: 0,
          is_correct: false,
        })
      );
    });

    it("should recalculate attempt score and set status to graded if all responses are graded", async () => {
      mockSupabase.getChain("profiles").single.mockResolvedValueOnce({ data: { role: "admin" } });
      mockSupabase.getChain("responses").resolveNextThen({ error: null });
      
      mockSupabase.getChain("responses").single.mockResolvedValueOnce({ data: { attempt_id: "attempt-1" } });
      mockSupabase.getChain("responses").returns.mockResolvedValueOnce({
        data: [
          { points_awarded: 5 },
          { points_awarded: 10 },
        ],
      });

      await gradeEssay("attempt-1", "res-1", 10, "Good");

      expect(mockSupabase.getChain("attempts").update).toHaveBeenCalledWith({
        score: 15,
        status: "graded",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/admin/grading");
    });

    it("should keep status as submitted if some responses are not yet graded", async () => {
      mockSupabase.getChain("profiles").single.mockResolvedValueOnce({ data: { role: "admin" } });
      mockSupabase.getChain("responses").resolveNextThen({ error: null });
      
      mockSupabase.getChain("responses").single.mockResolvedValueOnce({ data: { attempt_id: "attempt-1" } });
      mockSupabase.getChain("responses").returns.mockResolvedValueOnce({
        data: [
          { points_awarded: 5 },
          { points_awarded: null }, // un-graded
        ],
      });

      await gradeEssay("attempt-1", "res-1", 5, "Good");

      expect(mockSupabase.getChain("attempts").update).toHaveBeenCalledWith({
        score: 5,
        status: "submitted",
      });
    });

    it("should return error if response update fails", async () => {
      mockSupabase.getChain("profiles").single.mockResolvedValueOnce({ data: { role: "admin" } });
      mockSupabase.getChain("responses").resolveNextThen({ error: { message: "Update fail" } });
      
      const result = await gradeEssay("attempt-1", "res-1", 5, "Good");
      
      expect(result).toEqual({ error: "Update fail" });
      expect(mockSupabase.getChain("attempts").update).not.toHaveBeenCalled();
    });
  });
});
