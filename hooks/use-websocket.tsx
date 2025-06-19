"use client"

import { useState, useEffect, useRef } from "react"

export function useWebSocket(url: string) {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Create WebSocket connection
    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${url}`
    const socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      console.log("WebSocket connected")
      setConnected(true)
    }

    socket.onclose = () => {
      console.log("WebSocket disconnected")
      setConnected(false)
    }

    socket.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    socketRef.current = socket

    // Clean up on unmount
    return () => {
      socket.close()
    }
  }, [url])

  return { socket: socketRef.current, connected }
}

