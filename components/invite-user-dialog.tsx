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

interface InviteUserDialogProps {
  chatId: number
  onClose: () => void
  onInvite: () => void
}

export default function InviteUserDialog({ chatId, onClose, onInvite }: InviteUserDialogProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleInvite = async () => {
    if (!email.trim()) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/chats/${chatId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to invite user")
      }

      setSuccess(true)
      setTimeout(() => {
        onInvite()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>Invite a user to this chat by email address.</DialogDescription>
        </DialogHeader>

        {error && <div className="p-3 text-sm bg-red-50 text-red-500 rounded-md">{error}</div>}
        {success && (
          <div className="p-3 text-sm bg-green-50 text-green-500 rounded-md">Invitation sent successfully!</div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || success}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading || success || !email.trim()}>
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

