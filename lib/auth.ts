import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { query } from "./db"

// Generate a secure random string for JWT_SECRET with better fallback
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ompro-chat-secure-jwt-secret-key-2024-development",
)

export async function signToken(payload: any) {
  try {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET)
  } catch (error) {
    console.error("Error signing token:", error)
    throw new Error("Authentication error: Failed to sign token")
  }
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

export async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value

    if (!token) {
      return null
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.id) {
      return null
    }

    const users = (await query("SELECT id, name, email FROM users WHERE id = ?", [payload.id])) as any[]

    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error("Error getting user from token:", error)
    return null
  }
}

export function setAuthCookie(token: string) {
  try {
    cookies().set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "lax",
    })
  } catch (error) {
    console.error("Error setting auth cookie:", error)
    throw new Error("Authentication error: Failed to set cookie")
  }
}

export function removeAuthCookie() {
  try {
    cookies().delete("token")
  } catch (error) {
    console.error("Error removing auth cookie:", error)
  }
}

// Debug function to check JWT configuration
export function getJwtDebugInfo() {
  return {
    secretLength: JWT_SECRET.length,
    isProduction: process.env.NODE_ENV === "production",
    cookieSecure: process.env.NODE_ENV === "production",
  }
}

