"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        type="password"
        name="password"
        placeholder="Password"
        autoFocus
        required
        className="rounded border border-neutral-400 bg-transparent px-3 py-2"
      />
      <button
        disabled={pending}
        className="rounded bg-amber-700 px-3 py-2 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Checking…" : "Enter"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
