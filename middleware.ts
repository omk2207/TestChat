import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/auth"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/" ||
    path === "/login" ||
    path === "/register" ||
    path === "/setup" ||
    path.startsWith("/api/auth") ||
    path.startsWith("/api/test-db") ||
    path.startsWith("/api/setup-db") ||
    path.startsWith("/api/debug")

  // Get token from cookie
  const token = request.cookies.get("token")?.value

  // If the path is not public and there's no token, redirect to login
  if (!isPublicPath && !token) {
    console.log("Redirecting to login: No token for protected path", path)
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the path is login/register and there's a valid token, redirect to chat
  if ((path === "/login" || path === "/register") && token) {
    try {
      const payload = await verifyToken(token)
      if (payload) {
        console.log("Redirecting to chat: User already authenticated")
        return NextResponse.redirect(new URL("/chat", request.url))
      }
    } catch (error) {
      console.error("Token verification error in middleware:", error)
      // Continue to login/register if token verification fails
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

