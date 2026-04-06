import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSection, updateSection, deleteSection, reorderSection } from "../sections";
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

describe("sections actions", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (requireAdmin as any).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: "admin-123" },
    });
  });

  describe("createSection", () => {
    it("should auto-increment sort_order starting at 0 if no sections exist", async () => {
      const formData = new FormData();
      formData.append("title", "Section 1");

      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.getChain("sections").resolveNextThen({
        error: null,
      });

      await createSection("test-1", formData);

      expect(mockSupabase.getChain("sections").insert).toHaveBeenCalledWith({
        test_id: "test-1",
        title: "Section 1",
        description: null,
        sort_order: 0,
      });
      expect(revalidatePath).toHaveBeenCalledWith("/admin/tests/test-1");
    });

    it("should auto-increment sort_order based on existing sections", async () => {
      const formData = new FormData();
      formData.append("title", "Section 2");

      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({
        data: [{ sort_order: 2 }],
        error: null,
      });

      mockSupabase.getChain("sections").resolveNextThen({
        error: null,
      });

      await createSection("test-1", formData);

      expect(mockSupabase.getChain("sections").insert).toHaveBeenCalledWith({
        test_id: "test-1",
        title: "Section 2",
        description: null,
        sort_order: 3,
      });
    });

    it("should redirect with error query param on error", async () => {
      const formData = new FormData();
      formData.append("title", "Section 1");

      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.getChain("sections").resolveNextThen({
        error: { message: "Insert error" },
      });

      await expect(createSection("test-1", formData)).rejects.toThrow("REDIRECT: /admin/tests/test-1?error=Insert%20error");
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("updateSection", () => {
    it("should update section with correct calls and handle description", async () => {
      const formData = new FormData();
      formData.append("title", "Updated Section");
      formData.append("description", "A description");

      mockSupabase.getChain("sections").resolveNextThen({ error: null });

      await updateSection("test-1", "sec-1", formData);

      expect(mockSupabase.from).toHaveBeenCalledWith("sections");
      expect(mockSupabase.getChain("sections").update).toHaveBeenCalledWith({
        title: "Updated Section",
        description: "A description",
      });
      expect(mockSupabase.getChain("sections").eq).toHaveBeenCalledWith("id", "sec-1");
      expect(revalidatePath).toHaveBeenCalledWith("/admin/tests/test-1");
    });

    it("should redirect on error", async () => {
      const formData = new FormData();
      formData.append("title", "Updated Section");

      mockSupabase.getChain("sections").resolveNextThen({ error: { message: "Update failed" } });

      await expect(updateSection("test-1", "sec-1", formData)).rejects.toThrow("REDIRECT: /admin/tests/test-1?error=Update%20failed");
    });
  });

  describe("deleteSection", () => {
    it("should delete section and revalidate", async () => {
      mockSupabase.getChain("sections").resolveNextThen({ error: null });

      await deleteSection("test-1", "sec-1");

      expect(mockSupabase.getChain("sections").delete).toHaveBeenCalled();
      expect(mockSupabase.getChain("sections").eq).toHaveBeenCalledWith("id", "sec-1");
      expect(revalidatePath).toHaveBeenCalledWith("/admin/tests/test-1");
    });

    it("should redirect on error", async () => {
      mockSupabase.getChain("sections").resolveNextThen({ error: { message: "Delete failed" } });

      await expect(deleteSection("test-1", "sec-1")).rejects.toThrow("REDIRECT: /admin/tests/test-1?error=Delete%20failed");
    });
  });

  describe("reorderSection", () => {
    it("should swap sort_order with adjacent section moving up", async () => {
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({
        data: [
          { id: "sec-1", sort_order: 0 },
          { id: "sec-2", sort_order: 1 },
          { id: "sec-3", sort_order: 2 },
        ],
        error: null,
      });

      // We expect two updates, so we mock them to resolve cleanly
      mockSupabase.getChain("sections").resolveNextThen({ error: null });

      await reorderSection("test-1", "sec-2", "up");

      expect(mockSupabase.getChain("sections").update).toHaveBeenCalledWith({ sort_order: 0 });
      expect(mockSupabase.getChain("sections").eq).toHaveBeenCalledWith("id", "sec-2");

      expect(mockSupabase.getChain("sections").update).toHaveBeenCalledWith({ sort_order: 1 });
      expect(mockSupabase.getChain("sections").eq).toHaveBeenCalledWith("id", "sec-1");

      expect(revalidatePath).toHaveBeenCalledWith("/admin/tests/test-1");
    });

    it("should swap sort_order with adjacent section moving down", async () => {
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({
        data: [
          { id: "sec-1", sort_order: 0 },
          { id: "sec-2", sort_order: 1 },
          { id: "sec-3", sort_order: 2 },
        ],
        error: null,
      });

      mockSupabase.getChain("sections").resolveNextThen({ error: null });

      await reorderSection("test-1", "sec-2", "down");

      expect(mockSupabase.getChain("sections").update).toHaveBeenCalledWith({ sort_order: 2 });
      expect(mockSupabase.getChain("sections").eq).toHaveBeenCalledWith("id", "sec-2");

      expect(mockSupabase.getChain("sections").update).toHaveBeenCalledWith({ sort_order: 1 });
      expect(mockSupabase.getChain("sections").eq).toHaveBeenCalledWith("id", "sec-3");
    });

    it("should no-op when moving up from index 0", async () => {
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({
        data: [
          { id: "sec-1", sort_order: 0 },
          { id: "sec-2", sort_order: 1 },
        ],
        error: null,
      });

      await reorderSection("test-1", "sec-1", "up");

      expect(mockSupabase.getChain("sections").update).not.toHaveBeenCalled();
    });

    it("should no-op when moving down from last index", async () => {
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({
        data: [
          { id: "sec-1", sort_order: 0 },
          { id: "sec-2", sort_order: 1 },
        ],
        error: null,
      });

      await reorderSection("test-1", "sec-2", "down");

      expect(mockSupabase.getChain("sections").update).not.toHaveBeenCalled();
    });

    it("should no-op when sections data is null", async () => {
      mockSupabase.getChain("sections").returns.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await reorderSection("test-1", "sec-1", "up");

      expect(mockSupabase.getChain("sections").update).not.toHaveBeenCalled();
    });
  });
});
