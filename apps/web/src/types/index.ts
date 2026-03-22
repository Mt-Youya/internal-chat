export interface User {
  id: string
  name: string
  avatar: string
}

export type PeerStatus = 'connecting' | 'connected' | 'disconnected' | 'failed'

export interface Peer {
  user: User
  status: PeerStatus
  connection: RTCPeerConnection
  dataChannel: RTCDataChannel | null
}

export type MessageType = 'text' | 'file-meta' | 'file-chunk' | 'file-done' | 'file-abort'

export interface ChatMessage {
  id: string
  fromId: string
  fromName: string
  toId: string // 'all' 或 具体 userId
  type: 'text' | 'file'
  content: string
  fileName?: string
  fileSize?: number
  fileType?: string
  progress?: number // 0-100 for file transfer
  timestamp: number
  status: 'sending' | 'sent' | 'received' | 'failed'
}

export type SignalMessage =
  | { type: 'joined'; selfId: string; users: User[]; iceServers: RTCIceServer[] }
  | { type: 'user-joined'; user: User }
  | { type: 'user-left'; userId: string }
  | { type: 'offer'; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; from: string; candidate: RTCIceCandidateInit }
  | { type: 'error'; code: string }
  | { type: 'pong' }

export interface RoomConfig {
  name: string
  requiresPassword: boolean
  iceServers: RTCIceServer[] | null
}

// P2P 数据通道消息格式
export interface P2PTextMessage {
  kind: 'text'
  id: string
  content: string
  fromId: string
  fromName: string
  timestamp: number
}

export interface P2PFileMeta {
  kind: 'file-meta'
  id: string
  name: string
  size: number
  fileType: string
  totalChunks: number
  fromId: string
  fromName: string
  timestamp: number
}

export interface P2PFileChunk {
  kind: 'file-chunk'
  id: string
  index: number
  data: string // base64
}

export interface P2PFileDone {
  kind: 'file-done'
  id: string
}

export interface P2PFileAbort {
  kind: 'file-abort'
  id: string
}

export type P2PMessage = P2PTextMessage | P2PFileMeta | P2PFileChunk | P2PFileDone | P2PFileAbort