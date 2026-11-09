"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, roleForPassword } from "@/lib/session";

export async function login(_: string | null, formData: FormData) {
  const role = roleForPassword(String(formData.get("password") ?? ""));
  if (!role) return "Wrong password.";
  await createSession(role);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
