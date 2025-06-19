import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"
import { query } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { chatId: string } }) {
  const user = await getUserFromToken(request)

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const chatId = Number.parseInt(params.chatId)

  // Check if user is in chat
  const chatUsers = (await query("SELECT * FROM chat_users WHERE chat_id = ? AND user_id = ?", [
    chatId,
    user.id,
  ])) as any[]

  if (chatUsers.length === 0) {
    return NextResponse.json({ message: "Chat not found or access denied" }, { status: 404 })
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    // Find user by email
    const users = (await query("SELECT id FROM users WHERE email = ?", [email])) as any[]

    if (users.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const invitedUserId = users[0].id

    // Check if user is already in chat
    const existingChatUsers = (await query("SELECT * FROM chat_users WHERE chat_id = ? AND user_id = ?", [
      chatId,
      invitedUserId,
    ])) as any[]

    if (existingChatUsers.length > 0) {
      return NextResponse.json({ message: "User is already in this chat" }, { status: 409 })
    }

    // Add user to chat
    await query("INSERT INTO chat_users (chat_id, user_id, invited_by) VALUES (?, ?, ?)", [
      chatId,
      invitedUserId,
      user.id,
    ])

    return NextResponse.json({ message: "User invited successfully" })
  } catch (error) {
    console.error("Error inviting user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

