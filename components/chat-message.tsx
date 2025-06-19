import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Message = {
  id: number
  content: string
  timestamp: string
  sender: {
    name: string
    avatar?: string
  }
}

interface ChatMessageProps {
  message: Message
  isOwnMessage: boolean
}

export default function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className={`flex ${isOwnMessage ? "flex-row-reverse" : "flex-row"} max-w-[80%] items-end gap-2`}>
        {!isOwnMessage && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.sender.avatar} />
            <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
        <div>
          {!isOwnMessage && <p className="text-xs text-gray-500 mb-1 ml-1">{message.sender.name}</p>}
          <div
            className={`rounded-lg px-4 py-2 ${
              isOwnMessage ? "bg-primary text-primary-foreground" : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            <p className="text-sm">{message.content}</p>
          </div>
          <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </div>
  )
}

