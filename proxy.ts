import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 Proxy (upd middleware)
 *
 * Uses Supabase's updateSession for proper session management
 * - Validates actual session tokens instead of just checking cookies
 * - Handles session refresh automatically
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response object that we'll update
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for session validation
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session and validate - this is the recommended approach
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Skip authentication checks for OAuth callback route
  if (pathname.startsWith("/auth/callback")) {
    return response;
  }

  // List of protected routes that require authentication
  // Note: /explore and /project/[id] are intentionally public to allow users to explore projects
  const protectedRoutes = ["/onboarding", "/project/new-project", "/project/:path*"];

  // List of auth routes (redirect to dashboard if already authenticated)
  const authRoutes = ["/auth/sign-in", "/auth/signup"];

  // Check if current path is protected
   const isProtectedRoute = protectedRoutes.some(pattern => {
    // Convert the pattern to a regex for accurate matching of dynamic segments
    const regex = new RegExp(`^${pattern.replace(':path*', '(.*)')}$`);
    return regex.test(pathname);
  });

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to sign-in if accessing protected route without valid session
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    // Only set redirect parameter if not already on sign-in page to prevent loops
    if (pathname !== "/auth/sign-in") {
      url.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if accessing auth routes while authenticated
  // BUT only if there's no error parameter (to allow showing error messages)
  if (isAuthRoute && user && !request.nextUrl.searchParams.has("error")) {
    const url = request.nextUrl.clone();
    url.pathname = "/explore";
    return NextResponse.redirect(url);
  }

  // Continue with the request
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
