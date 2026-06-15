import { DashboardNavbar } from "@/components/navbar-dashboard";
import { getUser } from "@/lib/data/user";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // Fetch profile data if user is authenticated
  let profile = null;
  if (user) {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, username")
      .eq("id", user.id)
      .single();

    profile = data;
  }

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      <DashboardNavbar user={user} profile={profile} />
      <main className="flex-1 overflow-y-auto flex flex-col min-h-0">{children}</main>
    </div>
  );
}
