import { redirect } from "next/navigation";
import { getRole } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getRole()) redirect("/");
  return (
    <main className="mx-auto mt-24 w-full max-w-sm px-4">
      <h1 className="mb-6 leading-tight">
        <span className="block text-4xl">Ravnica</span>
        <span className="block text-xl">Welcome to the Show</span>
      </h1>
      <LoginForm />
    </main>
  );
}
