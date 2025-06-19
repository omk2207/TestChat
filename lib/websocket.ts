import { Server } from "ws"
import { parse } from "url"
import { verifyToken } from "./auth"

class WebSocketManager {
  private wss: Server | null = null
  private clients: Map<string, Set<any>> = new Map()

  initialize(server: any) {
    if (this.wss) return

    console.log("Initializing WebSocket server...")
    this.wss = new Server({ noServer: true })

    server.on("upgrade", async (request: any, socket: any, head: any) => {
      const { pathname } = parse(request.url)

      if (pathname === "/api/ws") {
        console.log("WebSocket connection attempt")
        // Get token from cookie
        const cookieHeader = request.headers.cookie || ""
        const tokenMatch = cookieHeader.match(/token=([^;]+)/)
        const token = tokenMatch ? tokenMatch[1] : null

        if (!token) {
          console.log("WebSocket connection rejected: No token")
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
          socket.destroy()
          return
        }

        try {
          // Verify token and get user
          const payload = await verifyToken(token)

          if (!payload || !payload.id) {
            console.log("WebSocket connection rejected: Invalid token")
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
            socket.destroy()
            return
          }

          console.log("WebSocket connection authorized for user:", payload.id)
          this.wss!.handleUpgrade(request, socket, head, (ws) => {
            ws.userId = payload.id
            this.wss!.emit("connection", ws, request, { id: payload.id })
          })
        } catch (error) {
          console.error("WebSocket authentication error:", error)
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
          socket.destroy()
        }
      }
    })

    this.wss.on("connection", (ws: any, request: any, user: any) => {
      const userId = user.id.toString()
      console.log("WebSocket connected for user:", userId)

      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set())
      }

      this.clients.get(userId)!.add(ws)

      ws.on("close", () => {
        console.log("WebSocket disconnected for user:", userId)
        const userClients = this.clients.get(userId)
        if (userClients) {
          userClients.delete(ws)
          if (userClients.size === 0) {
            this.clients.delete(userId)
          }
        }
      })
    })

    console.log("WebSocket server initialized")
  }

  broadcast(chatId: number | null, message: any) {
    if (!this.wss) {
      console.log("WebSocket server not initialized, cannot broadcast")
      return
    }

    console.log("Broadcasting message:", chatId ? `to chat ${chatId}` : "to all users", message.type)

    this.clients.forEach((clients, userId) => {
      clients.forEach((client: any) => {
        if (client.readyState === 1) {
          // OPEN
          client.send(JSON.stringify(message))
        }
      })
    })
  }
}

export const WebSocketServer = new WebSocketManager()

