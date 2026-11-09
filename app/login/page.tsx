import { redirect } from "next/navigation";
import { getRole } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getRole()) redirect("/");
  return (
    <main className="mx-auto mt-24 w-full max-w-sm px-4">
      <h1 className="mb-6 text-2xl font-semibold">Campaign Wiki</h1>
      <LoginForm />
    </main>
  );
}
