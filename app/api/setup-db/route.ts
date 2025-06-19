import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST() {
  try {
    console.log("Setting up database tables...")

    // Create users table
    console.log("Creating users table...")
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Create chats table
    console.log("Creating chats table...")
    await query(`
      CREATE TABLE IF NOT EXISTS chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `)

    // Create chat_users table
    console.log("Creating chat_users table...")
    await query(`
      CREATE TABLE IF NOT EXISTS chat_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT NOT NULL,
        user_id INT NOT NULL,
        invited_by INT,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY (chat_id, user_id)
      )
    `)

    // Create messages table
    console.log("Creating messages table...")
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT NOT NULL,
        sender_id INT NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    console.log("Database setup completed successfully")
    return NextResponse.json({
      status: "success",
      message: "Database tables created successfully",
    })
  } catch (error) {
    console.error("Error setting up database:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error setting up database",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

