import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Checking authentication status...")
    const user = await getUserFromToken(request)

    if (!user) {
      console.log("User not authenticated")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    console.log("User authenticated:", { id: user.id, name: user.name, email: user.email })
    return NextResponse.json(user)
  } catch (error) {
    console.error("Authentication check error:", error)
    return NextResponse.json(
      { message: "Authentication error", error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

