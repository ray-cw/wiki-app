import type { Metadata } from "next";
import Link from "next/link";
import { getRole } from "@/lib/session";
import { logout } from "./actions";
import { beleren, crimsonPro, scalySans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campaign Wiki",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const role = await getRole();
  return (
    <html
      lang="en"
      className={`${beleren.variable} ${crimsonPro.variable} ${scalySans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {role && (
          <header className="flex items-center justify-between border-b border-neutral-300 px-4 py-3 dark:border-neutral-700">
            <Link href="/" className="font-heading text-lg">
              Campaign Wiki
            </Link>
            <form action={logout} className="flex items-center gap-3 font-sans text-sm">
              <span>{role === "gm" ? "Gamemaster" : "Player"}</span>
              <button className="underline">Log out</button>
            </form>
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
