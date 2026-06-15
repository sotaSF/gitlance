import Link from "next/link";
import { Navbar } from "@/components/navbar-marketing";
import { Footer } from "@/components/footer";
import { getUser } from "@/lib/data/user";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function MarketingLayout({
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
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} profile={profile} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
