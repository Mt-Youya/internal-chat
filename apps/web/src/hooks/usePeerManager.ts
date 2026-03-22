import { useRef, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import { useChatStore } from "../stores/chat"
import type { User, P2PMessage } from "../types"

const CHUNK_SIZE = 16 * 1024 // 16KB

export function usePeerManager(send: (data: object) => void, iceServers: RTCIceServer[]) {
  const store = useChatStore.getState
  const iceServersRef = useRef(iceServers)
  iceServersRef.current = iceServers

  const createConnection = useCallback(
    (remoteUser: User, isInitiator: boolean) => {
      const {
        addPeer,
        updatePeerStatus,
        addMessage,
        setIncomingFile,
        removeIncomingFile,
        updateMessage,
        selfId,
        selfName,
      } = useChatStore.getState()

      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current })

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          send({ type: "ice-candidate", to: remoteUser.id, candidate: e.candidate })
        }
      }

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState
        if (state === "connected") updatePeerStatus(remoteUser.id, "connected")
        else if (state === "disconnected" || state === "failed" || state === "closed")
          updatePeerStatus(remoteUser.id, state === "failed" ? "failed" : "disconnected")
      }

      // ── Data channel ──────────────────────────────────────────────────────

      function setupDataChannel(dc: RTCDataChannel) {
        dc.binaryType = "arraybuffer"

        dc.onopen = () => updatePeerStatus(remoteUser.id, "connected")
        dc.onclose = () => updatePeerStatus(remoteUser.id, "disconnected")

        dc.onmessage = (e) => {
          let msg: P2PMessage
          try {
            msg = JSON.parse(e.data as string)
          } catch {
            return
          }

          if (msg.kind === "text") {
            addMessage({
              id: msg.id,
              fromId: msg.fromId,
              fromName: msg.fromName,
              toId: selfId ?? "",
              type: "text",
              content: msg.content,
              timestamp: msg.timestamp,
              status: "received",
            })
          }

          if (msg.kind === "file-meta") {
            setIncomingFile(msg.id, { meta: msg, chunks: [] })
            addMessage({
              id: msg.id,
              fromId: msg.fromId,
              fromName: msg.fromName,
              toId: selfId ?? "",
              type: "file",
              content: "",
              fileName: msg.name,
              fileSize: msg.size,
              fileType: msg.fileType,
              progress: 0,
              timestamp: msg.timestamp,
              status: "receiving" as never,
            })
          }

          if (msg.kind === "file-chunk") {
            const { incomingFiles, setIncomingFile, updateMessage } = useChatStore.getState()
            const entry = incomingFiles.get(msg.id)
            if (!entry) return
            const chunks = [...entry.chunks]
            chunks[msg.index] = msg.data
            setIncomingFile(msg.id, { ...entry, chunks })
            const progress = Math.round((chunks.filter(Boolean).length / entry.meta.totalChunks) * 100)
            updateMessage(msg.id, { progress })
          }

          if (msg.kind === "file-done") {
            const { incomingFiles, removeIncomingFile, updateMessage } = useChatStore.getState()
            const entry = incomingFiles.get(msg.id)
            if (!entry) return
            // Reassemble
            const binary = entry.chunks.map((c) => atob(c))
            const bytes = new Uint8Array(binary.reduce((acc, s) => acc + s.length, 0))
            let offset = 0
            for (const s of binary) {
              for (let i = 0; i < s.length; i++) bytes[offset++] = s.charCodeAt(i)
            }
            const blob = new Blob([bytes], { type: entry.meta.fileType })
            const url = URL.createObjectURL(blob)
            updateMessage(msg.id, { content: url, progress: 100, status: "received" })
            removeIncomingFile(msg.id)
          }

          if (msg.kind === "file-abort") {
            const { removeIncomingFile, updateMessage } = useChatStore.getState()
            updateMessage(msg.id, { status: "failed" })
            removeIncomingFile(msg.id)
          }
        }
      }

      let dc: RTCDataChannel | null = null

      if (isInitiator) {
        dc = pc.createDataChannel("chat", { ordered: true })
        setupDataChannel(dc)
      } else {
        pc.ondatachannel = (e) => {
          dc = e.channel
          setupDataChannel(dc)
          // Update peer's data channel ref
          const { peers, addPeer } = useChatStore.getState()
          const peer = peers.get(remoteUser.id)
          if (peer) addPeer({ ...peer, dataChannel: dc })
        }
      }

      addPeer({ user: remoteUser, status: "connecting", connection: pc, dataChannel: dc })

      return { pc, dc }
    },
    [send]
  )

  // ── Initiate offer ──────────────────────────────────────────────────────────

  const initiateOffer = useCallback(
    async (remoteUser: User) => {
      const { pc } = createConnection(remoteUser, true)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      send({ type: "offer", to: remoteUser.id, sdp: offer })
    },
    [createConnection, send]
  )

  // ── Handle incoming offer ───────────────────────────────────────────────────

  const handleOffer = useCallback(
    async (fromUser: User, sdp: RTCSessionDescriptionInit) => {
      const { peers } = useChatStore.getState()
      let pc: RTCPeerConnection

      if (peers.has(fromUser.id)) {
        pc = peers.get(fromUser.id)!.connection
      } else {
        const result = createConnection(fromUser, false)
        pc = result.pc
      }

      await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      send({ type: "answer", to: fromUser.id, sdp: answer })
    },
    [createConnection, send]
  )

  const handleAnswer = useCallback(async (fromId: string, sdp: RTCSessionDescriptionInit) => {
    const { peers } = useChatStore.getState()
    const peer = peers.get(fromId)
    if (peer) await peer.connection.setRemoteDescription(new RTCSessionDescription(sdp))
  }, [])

  const handleIceCandidate = useCallback(async (fromId: string, candidate: RTCIceCandidateInit) => {
    const { peers } = useChatStore.getState()
    const peer = peers.get(fromId)
    if (peer) await peer.connection.addIceCandidate(new RTCIceCandidate(candidate))
  }, [])

  // ── Send message via data channel ───────────────────────────────────────────

  const sendText = useCallback((targetId: string | null, content: string) => {
    const { peers, selfId, selfName, addMessage } = useChatStore.getState()
    const msgId = uuidv4()
    const timestamp = Date.now()

    const p2pMsg: P2PMessage = {
      kind: "text",
      id: msgId,
      content,
      fromId: selfId!,
      fromName: selfName,
      timestamp,
    }

    const targets = targetId ? [peers.get(targetId)].filter(Boolean) : Array.from(peers.values())

    targets.forEach((peer) => {
      if (peer?.dataChannel?.readyState === "open") {
        peer.dataChannel.send(JSON.stringify(p2pMsg))
      }
    })

    addMessage({
      id: msgId,
      fromId: selfId!,
      fromName: selfName,
      toId: targetId ?? "all",
      type: "text",
      content,
      timestamp,
      status: "sent",
    })
  }, [])

  const sendFile = useCallback(async (targetId: string | null, file: File) => {
    const { peers, selfId, selfName, addMessage, updateMessage } = useChatStore.getState()
    const msgId = uuidv4()
    const timestamp = Date.now()
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    const totalChunks = Math.ceil(bytes.length / CHUNK_SIZE)

    const targets = targetId ? [peers.get(targetId)].filter(Boolean) : Array.from(peers.values())

    const openTargets = targets.filter((p) => p?.dataChannel?.readyState === "open")
    if (!openTargets.length) return

    // Send file meta
    const meta: P2PMessage = {
      kind: "file-meta",
      id: msgId,
      name: file.name,
      size: file.size,
      fileType: file.type,
      totalChunks,
      fromId: selfId!,
      fromName: selfName,
      timestamp,
    }
    openTargets.forEach((p) => p!.dataChannel!.send(JSON.stringify(meta)))

    addMessage({
      id: msgId,
      fromId: selfId!,
      fromName: selfName,
      toId: targetId ?? "all",
      type: "file",
      content: URL.createObjectURL(file),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      progress: 0,
      timestamp,
      status: "sending",
    })

    // Send chunks
    for (let i = 0; i < totalChunks; i++) {
      const slice = bytes.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
      const base64 = btoa(String.fromCharCode(...slice))
      const chunk: P2PMessage = { kind: "file-chunk", id: msgId, index: i, data: base64 }
      openTargets.forEach((p) => p!.dataChannel!.send(JSON.stringify(chunk)))
      updateMessage(msgId, { progress: Math.round(((i + 1) / totalChunks) * 100) })
      // Yield to avoid blocking
      if (i % 10 === 0) await new Promise((r) => setTimeout(r, 0))
    }

    const done: P2PMessage = { kind: "file-done", id: msgId }
    openTargets.forEach((p) => p!.dataChannel!.send(JSON.stringify(done)))
    updateMessage(msgId, { progress: 100, status: "sent" })
  }, [])

  return { initiateOffer, handleOffer, handleAnswer, handleIceCandidate, sendText, sendFile }
}
