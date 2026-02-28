export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Protect all routes except auth, api/auth, static files, and public assets
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|logo.svg|manifest.json).*)",
  ],
};
