"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

export async function createTest(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const { data, error } = await supabase
    .from("tests")
    .insert({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      subject: formData.get("subject") as string,
      time_limit_minutes: formData.get("time_limit_minutes")
        ? Number(formData.get("time_limit_minutes"))
        : null,
      is_public: formData.get("is_public") === "on",
      assigned_to: (formData.get("assigned_to") as string) || null,
      created_by: user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    redirect(
      `/admin/tests/new?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/admin/tests");
  redirect(`/admin/tests/${data.id}`);
}

export async function updateTest(testId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("tests")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      subject: formData.get("subject") as string,
      time_limit_minutes: formData.get("time_limit_minutes")
        ? Number(formData.get("time_limit_minutes"))
        : null,
      is_public: formData.get("is_public") === "on",
      assigned_to: (formData.get("assigned_to") as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", testId);

  if (error) {
    redirect(
      `/admin/tests/${testId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/admin/tests/${testId}`);
  revalidatePath("/admin/tests");
  redirect(`/admin/tests/${testId}`);
}

export async function deleteTest(testId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("tests").delete().eq("id", testId);

  if (error) {
    redirect(
      `/admin/tests?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/admin/tests");
  redirect("/admin/tests");
}
