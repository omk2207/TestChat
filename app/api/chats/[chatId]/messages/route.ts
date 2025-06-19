import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"
import { query } from "@/lib/db"
import { WebSocketServer } from "@/lib/websocket"

export async function GET(request: NextRequest, { params }: { params: { chatId: string } }) {
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
    // Mark messages as read
    await query("UPDATE messages SET is_read = 1 WHERE chat_id = ? AND sender_id != ? AND is_read = 0", [
      chatId,
      user.id,
    ])

    // Get messages
    const messages = (await query(
      `
      SELECT m.id, m.chat_id as chatId, m.sender_id as senderId, 
             m.content, DATE_FORMAT(m.created_at, '%Y-%m-%dT%H:%i:%s') as timestamp,
             u.name as 'sender.name', NULL as 'sender.avatar'
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.created_at ASC
    `,
      [chatId],
    )) as any[]

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

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
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ message: "Message content is required" }, { status: 400 })
    }

    // Create message
    const result = (await query("INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)", [
      chatId,
      user.id,
      content,
    ])) as any

    const messageId = result.insertId

    // Get the created message
    const messages = (await query(
      `
      SELECT m.id, m.chat_id as chatId, m.sender_id as senderId, 
             m.content, DATE_FORMAT(m.created_at, '%Y-%m-%dT%H:%i:%s') as timestamp,
             u.name as 'sender.name', NULL as 'sender.avatar'
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `,
      [messageId],
    )) as any[]

    const message = messages[0]

    // Broadcast to WebSocket clients
    WebSocketServer.broadcast(chatId, {
      type: "message",
      chatId,
      message,
    })

    // Update chat last message for all users
    const chatUpdate = {
      id: chatId,
      lastMessage: content,
      lastMessageTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    WebSocketServer.broadcast(null, {
      type: "chat_update",
      chat: chatUpdate,
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

