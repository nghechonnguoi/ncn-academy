import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication (any logged-in user)
const PROTECTED_ROUTES = ["/dashboard", "/ai-tools", "/affiliate", "/assessment", "/admin"];
// Routes that require ADMIN role
const ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTES = ["/auth/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Cookie "ncn_auth" is set client-side after login for middleware detection
  const isAuthenticated = request.cookies.has("ncn_auth");
  // Cookie "ncn_role" is set client-side after login to carry the user role
  const userRole = request.cookies.get("ncn_role")?.value;

  // 1. Not authenticated → redirect to login
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Admin route → must have ADMIN role
  if (isAdminRoute && userRole !== "ADMIN") {
    // Let the page-level guard render the 403 UI (cookie may not be set yet on first render)
    // We only hard-redirect if we know the role is definitively not ADMIN
    if (userRole && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 3. Already authenticated → skip login/register pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
