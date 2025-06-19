import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request)

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const chats = (await query(
      `
      SELECT c.id, c.name, 
        (SELECT content FROM messages 
         WHERE chat_id = c.id 
         ORDER BY created_at DESC LIMIT 1) as lastMessage,
        (SELECT DATE_FORMAT(created_at, '%H:%i') FROM messages 
         WHERE chat_id = c.id 
         ORDER BY created_at DESC LIMIT 1) as lastMessageTime,
        (SELECT COUNT(*) FROM messages 
         WHERE chat_id = c.id AND sender_id != ? AND is_read = 0) as unreadCount
      FROM chats c
      JOIN chat_users cu ON c.id = cu.chat_id
      WHERE cu.user_id = ?
      ORDER BY (SELECT created_at FROM messages 
                WHERE chat_id = c.id 
                ORDER BY created_at DESC LIMIT 1) DESC
    `,
      [user.id, user.id],
    )) as any[]

    return NextResponse.json(chats)
  } catch (error) {
    console.error("Error fetching chats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request)

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ message: "Chat name is required" }, { status: 400 })
    }

    // Create chat
    const chatResult = (await query("INSERT INTO chats (name, created_by) VALUES (?, ?)", [name, user.id])) as any

    const chatId = chatResult.insertId

    // Add creator to chat
    await query("INSERT INTO chat_users (chat_id, user_id) VALUES (?, ?)", [chatId, user.id])

    return NextResponse.json({ id: chatId, name })
  } catch (error) {
    console.error("Error creating chat:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

