import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTest, updateTest, deleteTest } from "../tests";
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

describe("tests actions", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (requireAdmin as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: "admin-123" },
    });
  });

  describe("createTest", () => {
    it("should insert test with all form fields correctly extracted", async () => {
      const formData = new FormData();
      formData.append("title", "My Test");
      formData.append("description", "A description");
      formData.append("subject", "Math");
      formData.append("time_limit_minutes", "60");
      formData.append("is_public", "on");
      formData.append("assigned_to", "user-456");

      mockSupabase.getChain("tests").single.mockResolvedValueOnce({
        data: { id: "test-1" },
        error: null,
      });

      await expect(createTest(formData)).rejects.toThrow("REDIRECT: /admin/tests/test-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("tests");
      expect(mockSupabase.getChain("tests").insert).toHaveBeenCalledWith({
        title: "My Test",
        description: "A description",
        subject: "Math",
        time_limit_minutes: 60,
        is_public: true,
        assigned_to: "user-456",
        created_by: "admin-123",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/admin/tests");
    });

    it("should handle null optional fields correctly", async () => {
      const formData = new FormData();
      formData.append("title", "My Test");
      formData.append("subject", "Math");

      mockSupabase.getChain("tests").single.mockResolvedValueOnce({
        data: { id: "test-2" },
        error: null,
      });

      await expect(createTest(formData)).rejects.toThrow("REDIRECT: /admin/tests/test-2");

      expect(mockSupabase.getChain("tests").insert).toHaveBeenCalledWith({
        title: "My Test",
        description: null,
        subject: "Math",
        time_limit_minutes: null,
        is_public: false,
        assigned_to: null,
        created_by: "admin-123",
      });
    });

    it("should redirect to new test page with error query param on error", async () => {
      const formData = new FormData();
      formData.append("title", "My Test");
      formData.append("subject", "Math");

      mockSupabase.getChain("tests").single.mockResolvedValueOnce({
        data: null,
        error: { message: "Insert failed" },
      });

      await expect(createTest(formData)).rejects.toThrow("REDIRECT: /admin/tests/new?error=Insert%20failed");
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("updateTest", () => {
    it("should update with correct fields including updated_at timestamp", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-02T12:00:00Z"));

      const formData = new FormData();
      formData.append("title", "Updated Test");
      formData.append("description", "Updated desc");
      formData.append("subject", "Science");
      formData.append("time_limit_minutes", "90");
      formData.append("is_public", "on");

      mockSupabase.getChain("tests").resolveNextThen({
        error: null,
      });

      await expect(updateTest("test-1", formData)).rejects.toThrow("REDIRECT: /admin/tests/test-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("tests");
      expect(mockSupabase.getChain("tests").update).toHaveBeenCalledWith({
        title: "Updated Test",
        description: "Updated desc",
        subject: "Science",
        time_limit_minutes: 90,
        is_public: true,
        assigned_to: null,
        updated_at: "2026-04-02T12:00:00.000Z",
      });
      expect(mockSupabase.getChain("tests").eq).toHaveBeenCalledWith("id", "test-1");
      expect(revalidatePath).toHaveBeenCalledWith("/admin/tests/test-1");
      expect(revalidatePath).toHaveBeenCalledWith("/admin/tests");

      vi.useRealTimers();
    });

    it("should handle null optional fields correctly on update", async () => {
      const formData = new FormData();
      formData.append("title", "Updated Test");
      formData.append("subject", "Science");

      mockSupabase.getChain("tests").resolveNextThen({
        error: null,
      });

      await expect(updateTest("test-1", formData)).rejects.toThrow("REDIRECT: /admin/tests/test-1");

      expect(mockSupabase.getChain("tests").update).toHaveBeenCalledWith(expect.objectContaining({
        title: "Updated Test",
        description: null,
        subject: "Science",
        time_limit_minutes: null,
        is_public: false,
        assigned_to: null,
      }));
    });

    it("should redirect to test edit page with error on failure", async () => {
      const formData = new FormData();
      formData.append("title", "Updated Test");
      formData.append("subject", "Science");

      mockSupabase.getChain("tests").resolveNextThen({
        error: { message: "Update failed" },
      });

      await expect(updateTest("test-1", formData)).rejects.toThrow("REDIRECT: /admin/tests/test-1?error=Update%20failed");
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("deleteTest", () => {
    it("should delete by id and redirect to admin/tests on success", async () => {
      mockSupabase.getChain("tests").resolveNextThen({
        error: null,
      });

      await expect(deleteTest("test-1")).rejects.toThrow("REDIRECT: /admin/tests");

      expect(mockSupabase.from).toHaveBeenCalledWith("tests");
      expect(mockSupabase.getChain("tests").delete).toHaveBeenCalled();
      expect(mockSupabase.getChain("tests").eq).toHaveBeenCalledWith("id", "test-1");
      expect(revalidatePath).toHaveBeenCalledWith("/admin/tests");
    });

    it("should handle error when deleting and redirect with error", async () => {
      mockSupabase.getChain("tests").resolveNextThen({
        error: { message: "Delete failed" },
      });

      await expect(deleteTest("test-1")).rejects.toThrow("REDIRECT: /admin/tests?error=Delete%20failed");
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("should execute queries on the correct table", async () => {
       mockSupabase.getChain("tests").resolveNextThen({
        error: null,
      });

      await expect(deleteTest("test-1")).rejects.toThrow("REDIRECT: /admin/tests");
      expect(mockSupabase.from).toHaveBeenCalledWith("tests");
    });
  });
});
