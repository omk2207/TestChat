import { NextResponse } from "next/server"
import { query, testConnection, getDbConfig } from "@/lib/db"
import { getJwtDebugInfo } from "@/lib/auth"

export async function GET() {
  try {
    // Test database connection
    const isConnected = await testConnection()

    // Get environment variables (safely)
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST_SET: !!process.env.DB_HOST,
      DB_USER_SET: !!process.env.DB_USER,
      DB_PASS_SET: !!(process.env.DB_PASSWORD || process.env.DB_PASS),
      DB_NAME_SET: !!process.env.DB_NAME,
      JWT_SECRET_SET: !!process.env.JWT_SECRET,
    }

    // Check if tables exist
    let tablesExist = false
    if (isConnected) {
      try {
        const tables = (await query("SHOW TABLES")) as any[]
        tablesExist = tables.length > 0
      } catch (tableError) {
        console.error("Error checking tables:", tableError)
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: {
        connected: isConnected,
        config: getDbConfig(),
        tablesExist,
      },
      environment: envInfo,
      auth: getJwtDebugInfo(),
    })
  } catch (error) {
    console.error("Diagnostics error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

