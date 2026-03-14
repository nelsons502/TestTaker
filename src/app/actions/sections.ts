"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

export async function createSection(testId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  // Get the current max sort_order
  const { data: existing } = await supabase
    .from("sections")
    .select("sort_order")
    .eq("test_id", testId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .returns<{ sort_order: number }[]>();

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { error } = await supabase.from("sections").insert({
    test_id: testId,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    sort_order: nextOrder,
  });

  if (error) {
    redirect(
      `/admin/tests/${testId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/admin/tests/${testId}`);
}

export async function updateSection(
  testId: string,
  sectionId: string,
  formData: FormData
) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("sections")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
    })
    .eq("id", sectionId);

  if (error) {
    redirect(
      `/admin/tests/${testId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/admin/tests/${testId}`);
}

export async function deleteSection(testId: string, sectionId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("sections")
    .delete()
    .eq("id", sectionId);

  if (error) {
    redirect(
      `/admin/tests/${testId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/admin/tests/${testId}`);
}

export async function reorderSection(
  testId: string,
  sectionId: string,
  direction: "up" | "down"
) {
  const { supabase } = await requireAdmin();

  const { data: sections } = await supabase
    .from("sections")
    .select("id, sort_order")
    .eq("test_id", testId)
    .order("sort_order")
    .returns<{ id: string; sort_order: number }[]>();

  if (!sections) return;

  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx === -1) return;
  if (direction === "up" && idx === 0) return;
  if (direction === "down" && idx === sections.length - 1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  const currentOrder = sections[idx].sort_order;
  const swapOrder = sections[swapIdx].sort_order;

  await supabase
    .from("sections")
    .update({ sort_order: swapOrder })
    .eq("id", sectionId);

  await supabase
    .from("sections")
    .update({ sort_order: currentOrder })
    .eq("id", sections[swapIdx].id);

  revalidatePath(`/admin/tests/${testId}`);
}
