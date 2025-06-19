"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface NewChatDialogProps {
  onClose: () => void
  onChatCreated: (chatId: number) => void
}

export default function NewChatDialog({ onClose, onChatCreated }: NewChatDialogProps) {
  const [chatName, setChatName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreateChat = async () => {
    if (!chatName.trim()) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: chatName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create chat")
      }

      onChatCreated(data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Chat</DialogTitle>
          <DialogDescription>Enter a name for your new chat.</DialogDescription>
        </DialogHeader>

        {error && <div className="p-3 text-sm bg-red-50 text-red-500 rounded-md">{error}</div>}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="chatName" className="text-sm font-medium">
              Chat Name
            </label>
            <Input
              id="chatName"
              placeholder="My New Chat"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreateChat} disabled={loading || !chatName.trim()}>
            {loading ? "Creating..." : "Create Chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

