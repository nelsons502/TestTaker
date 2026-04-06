import { describe, it, expect, vi, beforeEach } from "vitest";
import { createQuestion, updateQuestion, deleteQuestion, reorderQuestion } from "../questions";
import { createMockSupabaseClient } from "./helpers";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/admin", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT: ${url}`);
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("questions actions", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (requireAdmin as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: "admin-123" },
    });
  });

  describe("createQuestion", () => {
    it("should auto-increment sort_order based on existing questions in the section", async () => {
      const formData = new FormData();
      formData.append("question_type", "essay");
      formData.append("content", "Write an essay");
      
      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({
        data: [{ sort_order: 5 }],
      });
      mockSupabase.getChain("questions").single.mockResolvedValueOnce({
        data: { id: "q-1" },
        error: null,
      });

      await createQuestion("test-1", "sec-1", formData);

      expect(mockSupabase.getChain("questions").insert).toHaveBeenCalledWith(
        expect.objectContaining({
          sort_order: 6,
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith("/admin/tests/test-1");
    });

    it("should start sort_order at 0 if none exist", async () => {
      const formData = new FormData();
      formData.append("question_type", "essay");
      formData.append("content", "Write an essay");
      
      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({
        data: [],
      });
      mockSupabase.getChain("questions").single.mockResolvedValueOnce({
        data: { id: "q-1" },
        error: null,
      });

      await createQuestion("test-1", "sec-1", formData);

      expect(mockSupabase.getChain("questions").insert).toHaveBeenCalledWith(
        expect.objectContaining({
          sort_order: 0,
        })
      );
    });

    it("should parse accepted_answers correctly for short_answer type", async () => {
      const formData = new FormData();
      formData.append("question_type", "short_answer");
      formData.append("content", "What is 2+2?");
      formData.append("accepted_answers", "4\nfour\n ");

      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({ data: [] });
      mockSupabase.getChain("questions").single.mockResolvedValueOnce({
        data: { id: "q-1" },
        error: null,
      });

      await createQuestion("test-1", "sec-1", formData);

      expect(mockSupabase.getChain("questions").insert).toHaveBeenCalledWith(
        expect.objectContaining({
          accepted_answers: ["4", "four"],
        })
      );
    });

    it("should create answer_options for multiple_choice", async () => {
      const formData = new FormData();
      formData.append("question_type", "multiple_choice");
      formData.append("content", "MCQ");
      formData.append("option_count", "2");
      formData.append("option_0_content", "Opt A");
      formData.append("option_1_content", "Opt B");
      formData.append("correct_option", "1");

      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({ data: [] });
      mockSupabase.getChain("questions").single.mockResolvedValueOnce({
        data: { id: "q-1" },
        error: null,
      });

      await createQuestion("test-1", "sec-1", formData);

      expect(mockSupabase.getChain("answer_options").insert).toHaveBeenCalledWith([
        { question_id: "q-1", content: "Opt A", is_correct: false, sort_order: 0 },
        { question_id: "q-1", content: "Opt B", is_correct: true, sort_order: 1 },
      ]);
    });

    it("should create exactly two options for true_false", async () => {
      const formData = new FormData();
      formData.append("question_type", "true_false");
      formData.append("content", "Is it true?");
      formData.append("correct_option", "true");

      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({ data: [] });
      mockSupabase.getChain("questions").single.mockResolvedValueOnce({
        data: { id: "q-1" },
        error: null,
      });

      await createQuestion("test-1", "sec-1", formData);

      expect(mockSupabase.getChain("answer_options").insert).toHaveBeenCalledWith([
        { question_id: "q-1", content: "True", is_correct: true, sort_order: 0 },
        { question_id: "q-1", content: "False", is_correct: false, sort_order: 1 },
      ]);
    });
  });

  describe("updateQuestion", () => {
    it("should update question content, explanation, points, and accepted_answers", async () => {
      const formData = new FormData();
      formData.append("question_type", "short_answer");
      formData.append("content", "New content");
      formData.append("explanation", "New explanation");
      formData.append("points", "5");
      formData.append("accepted_answers", "yes\ny");

      mockSupabase.getChain("questions").resolveNextThen({ error: null });

      await updateQuestion("test-1", "q-1", formData);

      expect(mockSupabase.getChain("questions").update).toHaveBeenCalledWith({
        content: "New content",
        explanation: "New explanation",
        points: 5,
        accepted_answers: ["yes", "y"],
      });
      expect(mockSupabase.getChain("questions").eq).toHaveBeenCalledWith("id", "q-1");
    });

    it("should delete existing options then re-create for multiple_choice", async () => {
      const formData = new FormData();
      formData.append("question_type", "multiple_choice");
      formData.append("content", "MCQ");
      formData.append("option_count", "1");
      formData.append("option_0_content", "Opt");
      formData.append("correct_option", "0");

      mockSupabase.getChain("questions").resolveNextThen({ error: null });

      await updateQuestion("test-1", "q-1", formData);

      expect(mockSupabase.getChain("answer_options").delete).toHaveBeenCalled();
      expect(mockSupabase.getChain("answer_options").eq).toHaveBeenCalledWith("question_id", "q-1");
      expect(mockSupabase.getChain("answer_options").insert).toHaveBeenCalledWith([
        { question_id: "q-1", content: "Opt", is_correct: true, sort_order: 0 },
      ]);
    });

    it("should delete existing and recreate True/False options for true_false", async () => {
      const formData = new FormData();
      formData.append("question_type", "true_false");
      formData.append("content", "Is it false?");
      formData.append("correct_option", "false");

      mockSupabase.getChain("questions").resolveNextThen({ error: null });

      await updateQuestion("test-1", "q-1", formData);

      expect(mockSupabase.getChain("answer_options").delete).toHaveBeenCalled();
      expect(mockSupabase.getChain("answer_options").eq).toHaveBeenCalledWith("question_id", "q-1");
      expect(mockSupabase.getChain("answer_options").insert).toHaveBeenCalledWith([
        { question_id: "q-1", content: "True", is_correct: false, sort_order: 0 },
        { question_id: "q-1", content: "False", is_correct: true, sort_order: 1 },
      ]);
    });
  });

  describe("deleteQuestion", () => {
    it("should delete by id and revalidate on success", async () => {
      mockSupabase.getChain("questions").resolveNextThen({ error: null });

      await deleteQuestion("test-1", "q-1");

      expect(mockSupabase.getChain("questions").delete).toHaveBeenCalled();
      expect(mockSupabase.getChain("questions").eq).toHaveBeenCalledWith("id", "q-1");
      expect(revalidatePath).toHaveBeenCalledWith("/admin/tests/test-1");
    });

    it("should redirect on error", async () => {
      mockSupabase.getChain("questions").resolveNextThen({ error: { message: "Error deleting" } });

      await expect(deleteQuestion("test-1", "q-1")).rejects.toThrow("REDIRECT: /admin/tests/test-1?error=Error%20deleting");
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("reorderQuestion", () => {
    it("should swap sort_order with adjacent question when moving up", async () => {
      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({
        data: [
          { id: "q-1", sort_order: 10 },
          { id: "q-2", sort_order: 20 },
        ],
      });
      mockSupabase.getChain("questions").resolveNextThen({ error: null });

      await reorderQuestion("test-1", "q-2", "sec-1", "up");

      expect(mockSupabase.getChain("questions").update).toHaveBeenCalledWith({ sort_order: 10 });
      expect(mockSupabase.getChain("questions").eq).toHaveBeenCalledWith("id", "q-2");

      expect(mockSupabase.getChain("questions").update).toHaveBeenCalledWith({ sort_order: 20 });
      expect(mockSupabase.getChain("questions").eq).toHaveBeenCalledWith("id", "q-1");
    });

    it("should swap sort_order with adjacent question when moving down", async () => {
      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({
        data: [
          { id: "q-1", sort_order: 10 },
          { id: "q-2", sort_order: 20 },
        ],
      });
      mockSupabase.getChain("questions").resolveNextThen({ error: null });

      await reorderQuestion("test-1", "q-1", "sec-1", "down");

      expect(mockSupabase.getChain("questions").update).toHaveBeenCalledWith({ sort_order: 20 });
      expect(mockSupabase.getChain("questions").eq).toHaveBeenCalledWith("id", "q-1");

      expect(mockSupabase.getChain("questions").update).toHaveBeenCalledWith({ sort_order: 10 });
      expect(mockSupabase.getChain("questions").eq).toHaveBeenCalledWith("id", "q-2");
    });

    it("should no-op when moving up from index 0", async () => {
      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({
        data: [{ id: "q-1", sort_order: 10 }],
      });

      await reorderQuestion("test-1", "q-1", "sec-1", "up");

      expect(mockSupabase.getChain("questions").update).not.toHaveBeenCalled();
    });

    it("should no-op when moving down from last index", async () => {
      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({
        data: [{ id: "q-1", sort_order: 10 }],
      });

      await reorderQuestion("test-1", "q-1", "sec-1", "down");

      expect(mockSupabase.getChain("questions").update).not.toHaveBeenCalled();
    });

    it("should no-op when questions list is null", async () => {
      mockSupabase.getChain("questions").returns.mockResolvedValueOnce({
        data: null,
      });

      await reorderQuestion("test-1", "q-1", "sec-1", "up");

      expect(mockSupabase.getChain("questions").update).not.toHaveBeenCalled();
    });
  });
});
