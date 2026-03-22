import { create } from "zustand"
import type { User, Peer, ChatMessage, PeerStatus } from "../types"

interface ChatStore {
  // Identity
  selfId: string | null
  selfName: string
  selfAvatar: string
  roomId: string
  setSelf: (id: string, name: string, avatar: string) => void
  setRoomId: (id: string) => void

  // Peers
  peers: Map<string, Peer>
  addPeer: (peer: Peer) => void
  removePeer: (userId: string) => void
  updatePeerStatus: (userId: string, status: PeerStatus) => void

  // Messages
  messages: ChatMessage[]
  addMessage: (msg: ChatMessage) => void
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void

  // UI state
  selectedPeerId: string | null // null = 群聊
  setSelectedPeer: (id: string | null) => void

  // Active file transfers: fileId -> chunks buffer
  incomingFiles: Map<string, { meta: import("../types").P2PFileMeta; chunks: string[] }>
  setIncomingFile: (id: string, data: { meta: import("../types").P2PFileMeta; chunks: string[] }) => void
  removeIncomingFile: (id: string) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  selfId: null,
  selfName: "",
  selfAvatar: "",
  roomId: "default",
  setSelf: (id, name, avatar) => set({ selfId: id, selfName: name, selfAvatar: avatar }),
  setRoomId: (id) => set({ roomId: id }),

  peers: new Map(),
  addPeer: (peer) =>
    set((s) => {
      const peers = new Map(s.peers)
      peers.set(peer.user.id, peer)
      return { peers }
    }),
  removePeer: (userId) =>
    set((s) => {
      const peers = new Map(s.peers)
      peers.delete(userId)
      return { peers }
    }),
  updatePeerStatus: (userId, status) =>
    set((s) => {
      const peers = new Map(s.peers)
      const peer = peers.get(userId)
      if (peer) peers.set(userId, { ...peer, status })
      return { peers }
    }),

  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  selectedPeerId: null,
  setSelectedPeer: (id) => set({ selectedPeerId: id }),

  incomingFiles: new Map(),
  setIncomingFile: (id, data) =>
    set((s) => {
      const incomingFiles = new Map(s.incomingFiles)
      incomingFiles.set(id, data)
      return { incomingFiles }
    }),
  removeIncomingFile: (id) =>
    set((s) => {
      const incomingFiles = new Map(s.incomingFiles)
      incomingFiles.delete(id)
      return { incomingFiles }
    }),
}))
