import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: usernameOrId } = await params;
  const supabase = await createServerSupabase();

  try {
    // First, try to find the user by username, then fallback to id
    let userId = usernameOrId;

    // Check if it's a username (not a UUID format)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        usernameOrId
      );

    if (!isUUID) {
      // Look up by username
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", usernameOrId)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      userId = profile.id;
    }

    const { data: reviews, error } = await supabase
      .from("user_reviews")
      .select(
        `
        id,
        rating,
        title,
        comment,
        created_at,
        reviewer:profiles!user_reviews_reviewer_id_fkey(
          id,
          display_name,
          avatar_url
        ),
        project:projects(
          id,
          title
        )
      `
      )
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
