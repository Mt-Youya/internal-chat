import Koa from 'koa'
import Router from 'koa-router'
import serve from 'koa-static'
import { createServer } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import path from 'node:path'
import fs from 'node:fs'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
    id: string
    name: string
    avatar: string
    roomId: string
    ws: WebSocket
}

interface Room {
    id: string
    name: string
    password?: string
    iceServers?: RTCIceServer[]
}

interface RTCIceServer {
    urls: string | string[]
    username?: string
    credential?: string
}

type SignalMessage =
    | { type: 'join'; roomId: string; name: string; avatar: string; password?: string }
    | { type: 'leave' }
    | { type: 'offer'; to: string; sdp: RTCSessionDescriptionInit }
    | { type: 'answer'; to: string; sdp: RTCSessionDescriptionInit }
    | { type: 'ice-candidate'; to: string; candidate: RTCIceCandidateInit }
    | { type: 'ping' }

// ─── Room config ─────────────────────────────────────────────────────────────

function loadRoomConfig(): Record<string, Room> {
    const configPath = path.join(process.cwd(), 'room_pwd.json')
    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        } catch {
            console.warn('Failed to parse room_pwd.json')
        }
    }
    return {}
}

// ─── State ────────────────────────────────────────────────────────────────────

const clients = new Map<string, Client>()
const roomConfig = loadRoomConfig()

function getClientsInRoom(roomId: string): Client[] {
    return Array.from(clients.values()).filter(c => c.roomId === roomId)
}

function broadcastUserList(roomId: string) {
    const members = getClientsInRoom(roomId).map(c => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
    }))
    const msg = JSON.stringify({ type: 'user-list', users: members })
    getClientsInRoom(roomId).forEach(c => {
        if (c.ws.readyState === WebSocket.OPEN) c.ws.send(msg)
    })
}

function sendTo(targetId: string, data: object) {
    const target = clients.get(targetId)
    if (target && target.ws.readyState === WebSocket.OPEN) {
        target.ws.send(JSON.stringify(data))
    }
}

// ─── Koa App ─────────────────────────────────────────────────────────────────

const app = new Koa()
const router = new Router()

// Serve built frontend
const staticDir = path.join(__dirname, '../../frontend/dist')
if (fs.existsSync(staticDir)) {
    app.use(serve(staticDir))
}

// REST API: get room info (ice servers, requires-password)
router.get('/api/room/:roomId', ctx => {
    const { roomId } = ctx.params
    const room = roomConfig[roomId]
    if (room) {
        ctx.body = {
            name: room.name,
            requiresPassword: !!room.password,
            iceServers: room.iceServers ?? null,
        }
    } else {
        ctx.body = { name: roomId, requiresPassword: false, iceServers: null }
    }
})

app.use(router.routes()).use(router.allowedMethods())

// ─── HTTP + WS Server ─────────────────────────────────────────────────────────

const server = createServer(app.callback())
const wss = new WebSocketServer({ server, path: '/ws/' })

wss.on('connection', (ws: WebSocket, req) => {
    const clientId = uuidv4()
    console.log(`[WS] Client connected: ${clientId}`)

    ws.on('message', (raw: Buffer) => {
        let msg: SignalMessage
        try {
            msg = JSON.parse(raw.toString())
        } catch {
            return
        }

        if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }))
            return
        }

        if (msg.type === 'join') {
            const { roomId, name, avatar, password } = msg

            // Check password
            const room = roomConfig[roomId]
            if (room?.password && room.password !== password) {
                ws.send(JSON.stringify({ type: 'error', code: 'WRONG_PASSWORD' }))
                return
            }

            const client: Client = { id: clientId, name, avatar, roomId, ws }
            clients.set(clientId, client)

            // Send self info + existing users
            const existingUsers = getClientsInRoom(roomId)
                .filter(c => c.id !== clientId)
                .map(c => ({ id: c.id, name: c.name, avatar: c.avatar }))

            ws.send(JSON.stringify({
                type: 'joined',
                selfId: clientId,
                users: existingUsers,
                iceServers: room?.iceServers ?? [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ],
            }))

            // Notify others
            getClientsInRoom(roomId)
                .filter(c => c.id !== clientId)
                .forEach(c => {
                    if (c.ws.readyState === WebSocket.OPEN) {
                        c.ws.send(JSON.stringify({
                            type: 'user-joined',
                            user: { id: clientId, name, avatar },
                        }))
                    }
                })

            console.log(`[WS] ${name} joined room ${roomId}`)
            return
        }

        const self = clients.get(clientId)
        if (!self) return

        if (msg.type === 'leave') {
            handleLeave(clientId)
            return
        }

        if (msg.type === 'offer') {
            sendTo(msg.to, { type: 'offer', from: clientId, sdp: msg.sdp })
            return
        }

        if (msg.type === 'answer') {
            sendTo(msg.to, { type: 'answer', from: clientId, sdp: msg.sdp })
            return
        }

        if (msg.type === 'ice-candidate') {
            sendTo(msg.to, { type: 'ice-candidate', from: clientId, candidate: msg.candidate })
            return
        }
    })

    ws.on('close', () => {
        console.log(`[WS] Client disconnected: ${clientId}`)
        handleLeave(clientId)
    })

    ws.on('error', err => {
        console.error(`[WS] Error for ${clientId}:`, err.message)
    })
})

function handleLeave(clientId: string) {
    const client = clients.get(clientId)
    if (!client) return
    const { roomId } = client
    clients.delete(clientId)

    getClientsInRoom(roomId).forEach(c => {
        if (c.ws.readyState === WebSocket.OPEN) {
            c.ws.send(JSON.stringify({ type: 'user-left', userId: clientId }))
        }
    })
}

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 8081)
server.listen(PORT, () => {
    console.log(`✅ internal-chat server running at http://localhost:${PORT}`)
    console.log(`   WebSocket: ws://localhost:${PORT}/ws/`)
})