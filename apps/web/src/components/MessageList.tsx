import { useEffect, useRef } from "react"
import { useChatStore } from "../stores/chat"
import { Avatar } from "@chat/ui"
import { formatTime, formatFileSize } from "@/utils"
import type { ChatMessage } from "../types"

function FileMessage({ msg }: { msg: ChatMessage }) {
  const isSelf = msg.fromId === useChatStore.getState().selfId
  const isDone = msg.progress === 100 || msg.status === "received" || msg.status === "sent"

  return (
    <div
      className="rounded-2xl p-3 max-w-xs"
      style={{
        background: isSelf ? "rgba(91,110,245,0.15)" : "var(--bg-elevated)",
        border: `1px solid ${isSelf ? "rgba(91,110,245,0.3)" : "var(--border)"}`,
        minWidth: 200,
      }}
    >
      {/* File icon + name */}
      <div className="flex items-start gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "var(--bg-hover)" }}
        >
          {getFileIcon(msg.fileType ?? "")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {msg.fileName}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {formatFileSize(msg.fileSize ?? 0)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {!isDone && typeof msg.progress === "number" && (
        <div className="rounded-full overflow-hidden mb-2" style={{ height: 3, background: "var(--bg-hover)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${msg.progress}%`,
              background: "linear-gradient(90deg, var(--accent), var(--green))",
            }}
          />
        </div>
      )}

      {/* Action */}
      {isDone && msg.content && (
        <a
          href={msg.content}
          download={msg.fileName}
          className="flex items-center gap-1.5 text-xs font-medium mt-1 transition-opacity hover:opacity-80"
          style={{ color: "var(--accent)" }}
        >
          ↓ 下载文件
        </a>
      )}

      {!isDone && (
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {msg.progress ?? 0}% · {isSelf ? "发送中" : "接收中"}…
        </div>
      )}

      {msg.status === "failed" && (
        <div className="text-xs" style={{ color: "var(--red)" }}>
          传输失败
        </div>
      )}
    </div>
  )
}

function getFileIcon(type: string): string {
  if (type.startsWith("image/")) return "🖼️"
  if (type.startsWith("video/")) return "🎬"
  if (type.startsWith("audio/")) return "🎵"
  if (type.includes("pdf")) return "📄"
  if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return "🗜️"
  if (type.includes("text")) return "📝"
  return "📎"
}

interface MessageBubbleProps {
  msg: ChatMessage
}

function MessageBubble({ msg }: MessageBubbleProps) {
  const { selfId } = useChatStore()
  const isSelf = msg.fromId === selfId

  return (
    <div className={`flex gap-2.5 animate-fade-in-up ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
      {!isSelf && <Avatar name={msg.fromName} size="sm" />}

      <div className={`flex flex-col gap-1 max-w-[70%] ${isSelf ? "items-end" : "items-start"}`}>
        {!isSelf && (
          <span className="text-xs px-1" style={{ color: "var(--text-muted)" }}>
            {msg.fromName}
          </span>
        )}

        {msg.type === "file" ? (
          <FileMessage msg={msg} />
        ) : (
          <div
            className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
            style={{
              background: isSelf ? "linear-gradient(135deg, var(--accent), #4a5ce0)" : "var(--bg-elevated)",
              color: isSelf ? "#fff" : "var(--text-primary)",
              border: isSelf ? "none" : "1px solid var(--border)",
              boxShadow: isSelf ? "0 4px 16px rgba(91,110,245,0.3)" : "none",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              borderRadius: isSelf ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
            }}
          >
            {msg.content}
          </div>
        )}

        <span className="text-xs px-1" style={{ color: "var(--text-muted)" }}>
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  )
}

interface MessageListProps {
  targetId: string | null
}

export function MessageList({ targetId }: MessageListProps) {
  const { messages, selfId } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Filter messages for this "conversation"
  const filtered = messages.filter((m) => {
    if (targetId === null) {
      // 广播消息：toId = 'all' 的，或者自己发给 all 的
      return m.toId === "all" || (m.fromId === selfId && m.toId === "all")
    }
    // 私聊：来自 targetId 发给我，或我发给 targetId
    return (m.fromId === targetId && m.toId === selfId) || (m.fromId === selfId && m.toId === targetId)
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [filtered.length])

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="text-4xl">💬</div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {targetId ? "与对方的私聊记录为空" : "还没有消息，发第一条吧！"}
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
      {filtered.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
