import { NextResponse } from "next/server"
import { getJwtDebugInfo } from "@/lib/auth"
import { getDbConfig } from "@/lib/db"

export async function GET() {
  // Only enable in development mode
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Debug endpoint disabled in production" }, { status: 403 })
  }

  try {
    const debugInfo = {
      environment: process.env.NODE_ENV,
      jwt: getJwtDebugInfo(),
      database: getDbConfig(),
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json(
      {
        message: "Error retrieving debug information",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

