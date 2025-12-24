import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Try multiple ways to get the cookie (handles edge runtime differences)
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = request.cookies;

  // Try getting cookie from cookies object first
  let token = cookies.get("user_token")?.value;

  // Fallback: parse from cookie header if cookies.get() doesn't work in edge runtime
  if (!token && cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)user_token=([^;]*)/);
    token = match ? match[1] : undefined;
  }

  // Debug logging (remove in production if needed)
  console.log("Middleware - Path:", pathname);
  console.log("Middleware - Cookie header exists:", !!cookieHeader);
  console.log("Middleware - Token found:", !!token);
  console.log(
    "Middleware - All cookies:",
    Array.from(cookies.getAll()).map((c) => c.name)
  );

  // Protect /customize routes - redirect to login if not authenticated
  if (pathname.startsWith("/customize") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (token && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js|json)).*)",
  ],
};
