import { cookies } from "next/headers";

/**
 * Clears all Supabase authentication cookies
 * Use this when handling auth errors to prevent redirect loops
 */
export async function clearAuthCookies(): Promise<void> {
    
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  allCookies.forEach((cookie) => {
    // Clear all Supabase-related cookies
    if (cookie.name.includes("sb-")) {
      cookieStore.delete(cookie.name);
    }
  });
}

/**
 * Checks if any Supabase auth cookies exist
 */
export async function hasAuthCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  return allCookies.some(
    (cookie) =>
      cookie.name.includes("sb-") && cookie.name.includes("-auth-token")
  );
}
