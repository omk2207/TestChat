"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlusCircle, Send, LogOut, UserPlus } from "lucide-react"
import ChatMessage from "@/components/chat-message"
import InviteUserDialog from "@/components/invite-user-dialog"
import NewChatDialog from "@/components/new-chat-dialog"
import { useWebSocket } from "@/hooks/use-websocket"

type User = {
  id: number
  name: string
  email: string
  avatar?: string
}

type Chat = {
  id: number
  name: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

type Message = {
  id: number
  chatId: number
  senderId: number
  content: string
  timestamp: string
  sender: {
    name: string
    avatar?: string
  }
}

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { socket, connected } = useWebSocket("/api/ws")

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (!response.ok) {
          throw new Error("Not authenticated")
        }
        const userData = await response.json()
        setUser(userData)
        fetchChats()
      } catch (error) {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (socket && connected) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === "message" && data.chatId === activeChat) {
          setMessages((prev) => [...prev, data.message])
        } else if (data.type === "chat_update") {
          setChats((prev) => prev.map((chat) => (chat.id === data.chat.id ? { ...chat, ...data.chat } : chat)))
        }
      }
    }
  }, [socket, connected, activeChat])

  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chats")
      if (!response.ok) throw new Error("Failed to fetch chats")
      const data = await response.json()
      setChats(data)
      if (data.length > 0 && !activeChat) {
        setActiveChat(data[0].id)
        fetchMessages(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching chats:", error)
    }
  }

  const fetchMessages = async (chatId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`)
      if (!response.ok) throw new Error("Failed to fetch messages")
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const handleChatSelect = (chatId: number) => {
    setActiveChat(chatId)
    fetchMessages(chatId)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChat || !user) return

    try {
      const response = await fetch(`/api/chats/${activeChat}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newMessage }),
      })

      if (!response.ok) throw new Error("Failed to send message")
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{user?.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 flex justify-between items-center">
          <h3 className="font-medium">Chats</h3>
          <Button variant="ghost" size="icon" onClick={() => setShowNewChatDialog(true)}>
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center space-x-3 ${
                activeChat === chat.id ? "bg-gray-100 dark:bg-gray-800" : ""
              }`}
              onClick={() => handleChatSelect(chat.id)}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <h4 className="font-medium truncate">{chat.name}</h4>
                  {chat.lastMessageTime && <span className="text-xs text-gray-500">{chat.lastMessageTime}</span>}
                </div>
                {chat.lastMessage && <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>}
              </div>
              {chat.unreadCount ? (
                <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center">
                  {chat.unreadCount}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="font-semibold">{chats.find((c) => c.id === activeChat)?.name}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} isOwnMessage={message.senderId === user?.id} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium">No chat selected</h3>
              <p className="text-gray-500">Select a chat or create a new one</p>
              <Button className="mt-4" onClick={() => setShowNewChatDialog(true)}>
                <PlusCircle className="h-5 w-5 mr-2" />
                New Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      {showInviteDialog && (
        <InviteUserDialog
          chatId={activeChat!}
          onClose={() => setShowInviteDialog(false)}
          onInvite={() => {
            setShowInviteDialog(false)
            // Refresh chat list after inviting
            fetchChats()
          }}
        />
      )}

      {showNewChatDialog && (
        <NewChatDialog
          onClose={() => setShowNewChatDialog(false)}
          onChatCreated={(chatId) => {
            setShowNewChatDialog(false)
            fetchChats()
            setActiveChat(chatId)
            fetchMessages(chatId)
          }}
        />
      )}
    </div>
  )
}

