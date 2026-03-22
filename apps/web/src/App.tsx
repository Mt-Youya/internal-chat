import { useState, useCallback, useRef } from "react"
import { JoinRoom } from "./components/JoinRoom"
import { ChatLayout } from "./layouts/ChatLayout"
import { useSignaling } from "./hooks/useSignaling"
import { usePeerManager } from "./hooks/usePeerManager"
import { useChatStore } from "./stores/chat"
import type { SignalMessage, User } from "./types"

type AppState = "join" | "chat"

export default function App() {
  const [appState, setAppState] = useState<AppState>("join")
  const [joinError, setJoinError] = useState<string | null>(null)
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ])

  const { setSelf, setRoomId, peers, removePeer, selfId } = useChatStore()

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
      const avatar = ""
      setSelf("", name, avatar)
      setRoomId(roomId)

      return new Promise<void>((resolve, reject) => {
        const ws = connect()

        const timeout = setTimeout(() => {
          reject(new Error("CONNECTION_TIMEOUT"))
          setJoinError("连接超时，请检查服务是否启动")
        }, 8000)

        ws.onopen = () => {
          clearTimeout(timeout)
          send({ type: "join", roomId, name, avatar, password })
          resolve()
        }

        ws.onerror = () => {
          clearTimeout(timeout)
          setJoinError("无法连接到服务器，请确认后端已启动")
          reject(new Error("WS_ERROR"))
        }
      })
    },
    [connect, send, setSelf, setRoomId]
  )

  // ── Leave ─────────────────────────────────────────────────────────────────────
  const handleLeave = useCallback(() => {
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
  }, [send, disconnect])

  // ── Render ───────────────────────────────────────────────────────────────────
  if (appState === "join") {
    return <JoinRoom onJoin={handleJoin} error={joinError} />
  }

  return <ChatLayout onSendText={sendText} onSendFile={sendFile} onLeave={handleLeave} />
}
