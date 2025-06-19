import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query, testConnection } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Registration attempt started")

    // First, test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error("Registration failed: Database connection error")
      return NextResponse.json(
        { message: "Database connection error. Please check your database settings." },
        { status: 500 },
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("Registration request received:", {
        name: body.name,
        email: body.email,
        passwordLength: body.password ? body.password.length : 0,
      })
    } catch (parseError) {
      console.error("Registration failed: Invalid JSON", parseError)
      return NextResponse.json({ message: "Invalid request format" }, { status: 400 })
    }

    const { name, email, password } = body

    // Enhanced validation
    if (!name || !email || !password) {
      console.log("Registration failed: Missing required fields")
      return NextResponse.json({ message: "Name, email and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("Registration failed: Password too short")
      return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("Registration failed: Invalid email format")
      return NextResponse.json({ message: "Please enter a valid email address" }, { status: 400 })
    }

    // Check if user already exists
    try {
      console.log("Checking if user already exists:", email)
      const existingUsers = (await query("SELECT id FROM users WHERE email = ?", [email])) as any[]

      if (existingUsers.length > 0) {
        console.log("Registration failed: User already exists")
        return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
      }
    } catch (dbError) {
      console.error("Error checking existing user:", dbError)
      return NextResponse.json(
        {
          message: "Database error while checking existing user",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 },
      )
    }

    // Hash password with better salt rounds
    let hashedPassword
    try {
      console.log("Hashing password...")
      const salt = await bcrypt.genSalt(10) // Reduced from 12 to 10 to avoid potential performance issues
      hashedPassword = await bcrypt.hash(password, salt)
    } catch (hashError) {
      console.error("Error hashing password:", hashError)
      return NextResponse.json(
        {
          message: "Error processing password",
          details: hashError instanceof Error ? hashError.message : String(hashError),
        },
        { status: 500 },
      )
    }

    // Create user
    try {
      console.log("Creating new user in database...")
      const result = (await query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
        name,
        email,
        hashedPassword,
      ])) as any

      console.log("User registered successfully:", { id: result.insertId, name, email })

      return NextResponse.json({ message: "User registered successfully", userId: result.insertId }, { status: 201 })
    } catch (insertError) {
      console.error("Error inserting new user:", insertError)
      return NextResponse.json(
        {
          message: "Database error while creating user",
          details: insertError instanceof Error ? insertError.message : String(insertError),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unhandled registration error:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

