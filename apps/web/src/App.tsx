import { useState, useCallback, useRef, useEffect } from "react"
import { JoinRoom } from "./components/JoinRoom"
import { ChatLayout } from "./layouts/ChatLayout"
import { useSignaling } from "./hooks/useSignaling"
import { usePeerManager } from "./hooks/usePeerManager"
import { useChatStore } from "./stores/chat"
import type { SignalMessage, User } from "./types"
import { useTheme } from "@/components/theme-provider.tsx"

type AppState = "join" | "chat"

export default function App() {
  const [appState, setAppState] = useState<AppState>("join")
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ])

  const { setSelf, setRoomId, peers, removePeer, selfId } = useChatStore()
  const { theme } = useTheme()
  
  // 监听主题变化
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  
  // 初始化效果
  useEffect(() => {
    // 添加加载完成类
    const timer = setTimeout(() => {
      document.body.classList.add('loaded')
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // ── Signaling message handler ───────────────────────────────────────────────
  const handleSignal = useCallback(
    (msg: SignalMessage) => {
      switch (msg.type) {
        case "joined": {
          setSelf(msg.selfId, useChatStore.getState().selfName, useChatStore.getState().selfAvatar)
          iceServersRef.current = msg.iceServers
          setAppState("chat")
          setJoinError(null)

          // Initiate offers to all existing users
          msg.users.forEach((user) => {
            initiateOffer(user)
          })
          break
        }

        case "user-joined": {
          // New user joined: they will send us an offer, just wait
          // (The new user is the initiator, they will call initiateOffer)
          break
        }

        case "user-left": {
          const peer = useChatStore.getState().peers.get(msg.userId)
          if (peer) {
            peer.connection.close()
            removePeer(msg.userId)
          }
          break
        }

        case "offer": {
          const fromUser: User = { id: msg.from, name: "加载中…", avatar: "" }
          // We'll get the real name from peer manager later
          handleOffer(fromUser, msg.sdp)
          break
        }

        case "answer": {
          handleAnswer(msg.from, msg.sdp)
          break
        }

        case "ice-candidate": {
          handleIceCandidate(msg.from, msg.candidate)
          break
        }

        case "error": {
          setJoinError(msg.code)
          setAppState("join")
          break
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const { connect, disconnect, send } = useSignaling(handleSignal)

  const { initiateOffer, handleOffer, handleAnswer, handleIceCandidate, sendText, sendFile } = usePeerManager(
    send,
    iceServersRef.current
  )

  // ── Join ─────────────────────────────────────────────────────────────────────
  const handleJoin = useCallback(
    async (name: string, roomId: string, password?: string) => {
      setIsLoading(true)
      const avatar = ""
      setSelf("", name, avatar)
      setRoomId(roomId)

      return new Promise<void>((resolve, reject) => {
        const ws = connect()

        const timeout = setTimeout(() => {
          reject(new Error("CONNECTION_TIMEOUT"))
          setJoinError("连接超时，请检查服务是否启动")
          setIsLoading(false)
        }, 8000)

        ws.onopen = () => {
          clearTimeout(timeout)
          send({ type: "join", roomId, name, avatar, password })
          resolve()
        }

        ws.onerror = () => {
          clearTimeout(timeout)
          setJoinError("无法连接到服务器，请确认后端已启动")
          setIsLoading(false)
          reject(new Error("WS_ERROR"))
        }
      })
    },
    [connect, send, setSelf, setRoomId]
  )

  // ── Leave ─────────────────────────────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    // 添加离开动画
    const appElement = document.querySelector('.app-container')
    if (appElement) {
      appElement.classList.add('leaving')
    }
    
    setTimeout(() => {
      send({ type: "leave" })
      // Close all peer connections
      useChatStore.getState().peers.forEach((peer) => {
        peer.connection.close()
      })
      disconnect()
      // Reset store
      useChatStore.setState({
        selfId: null,
        peers: new Map(),
        messages: [],
        selectedPeerId: null,
        incomingFiles: new Map(),
      })
      setAppState("join")
      
      // 移除离开动画类
      if (appElement) {
        appElement.classList.remove('leaving')
      }
    }, 300)
  }, [send, disconnect])

  // ── Render ───────────────────────────────────────────────────────────────────
  if (appState === "join") {
    return (
      <div className="app-transition-container">
        <JoinRoom onJoin={handleJoin} error={joinError} />
        
        {/* 全局加载指示器 */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">
                正在连接房间...
              </p>
            </div>
          </div>
        )}
        
        {/* 主题切换提示 */}
        <div className="fixed bottom-4 right-4 z-40">
          <div className="text-xs px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground">
            当前主题: {theme === 'dark' ? '🌙 暗色' : theme === 'light' ? '☀️ 亮色' : '⚙️ 系统'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-transition-container slide-in">
      <ChatLayout onSendText={sendText} onSendFile={sendFile} onLeave={handleLeave} />
      
      {/* 连接状态浮动提示 */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50">
          <div className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">
            {peers.size} 人在线
          </span>
        </div>
      </div>
    </div>
  )
}
