import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const cookieHeader = request.headers.get("cookie") || "";

  let token: string | undefined;

  if (cookieHeader) {
    const patterns = [
      /(?:^|;\s*)user_token=([^;]*)/,
      /user_token=([^;,\s]*)/,
      /"user_token":"([^"]*)"/,
    ];

    for (const pattern of patterns) {
      const match = cookieHeader.match(pattern);
      if (match && match[1]) {
        token = match[1].trim();
        break;
      }
    }
  }

  if (!token) {
    try {
      token = request.cookies.get("user_token")?.value;
    } catch {}
  }

  if (process.env.NODE_ENV === "development") {
    console.log("Proxy - Path:", pathname);
    console.log("Proxy - Cookie header length:", cookieHeader.length);
    console.log("Proxy - Token found:", !!token);
    console.log(
      "Proxy - Cookie header preview:",
      cookieHeader.substring(0, 100)
    );
  }

  if (pathname.startsWith("/customize") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

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
