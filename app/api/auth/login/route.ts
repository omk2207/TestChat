import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"
import { signToken, setAuthCookie, getJwtDebugInfo } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("Login attempt:", { email })

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Find user with detailed logging
    console.log("Finding user with email:", email)
    const users = (await query("SELECT id, name, email, password FROM users WHERE email = ?", [email])) as any[]

    if (users.length === 0) {
      console.log("User not found:", email)
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]
    console.log("User found:", { id: user.id, name: user.name, email: user.email })

    // Verify password with detailed logging
    console.log("Verifying password...")
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      console.log("Invalid password for user:", email)
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    console.log("Password verified successfully")

    // Create token with debug info
    console.log("Creating JWT token...")
    const jwtDebug = getJwtDebugInfo()
    console.log("JWT configuration:", jwtDebug)

    const token = await signToken({ id: user.id })
    console.log("Token created successfully")

    // Set cookie
    console.log("Setting auth cookie...")
    setAuthCookie(token)
    console.log("Auth cookie set successfully")

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

