import { NextResponse } from "next/server"
import { testConnection, getDbConfig } from "@/lib/db"

export async function GET() {
  try {
    console.log("Testing database connection...")
    const isConnected = await testConnection()

    if (isConnected) {
      console.log("Database connection test successful")
      return NextResponse.json({
        status: "success",
        message: "Database connection successful",
        config: getDbConfig(),
      })
    } else {
      console.log("Database connection test failed")
      return NextResponse.json(
        {
          status: "error",
          message: "Database connection failed",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error testing database connection:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error testing database connection",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

