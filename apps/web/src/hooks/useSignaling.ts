import { useRef, useCallback, useEffect } from 'react'
import type { SignalMessage } from '../types'

type MessageHandler = (msg: SignalMessage) => void

export function useSignaling(onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const connect = useCallback(() => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${protocol}://${location.host}/ws/`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const msg: SignalMessage = JSON.parse(e.data)
        onMessageRef.current(msg)
      } catch { /* ignore */ }
    }

    ws.onclose = () => {
      // Reconnect after 3s
      setTimeout(connect, 3000)
    }

    return ws
  }, [])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  // Heartbeat
  useEffect(() => {
    const timer = setInterval(() => {
      send({ type: 'ping' })
    }, 25000)
    return () => clearInterval(timer)
  }, [send])

  return { connect, disconnect, send }
}