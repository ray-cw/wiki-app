import { redirect } from "next/navigation";
import { listGuilds } from "@/lib/content";
import { getRole } from "@/lib/session";
import { GuildWheel } from "./guild-wheel";

export default async function Home() {
  const role = await getRole();
  if (!role) redirect("/login");
  const guilds = await listGuilds(role);

  return (
    <main className="flex w-full flex-1 items-center justify-center px-4 py-8">
      <GuildWheel
        guilds={guilds.map(({ slug, title, icon }) => ({ slug, title, icon: icon! }))}
      />
    </main>
  );
}
