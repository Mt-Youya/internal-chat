import { useState, useRef, KeyboardEvent, ChangeEvent, DragEvent } from "react"
import { formatFileSize } from "../utils"
import { Button } from "@chat/ui"

interface MessageInputProps {
  onSendText: (text: string) => void
  onSendFile: (file: File) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({ onSendText, onSendFile, disabled, placeholder }: MessageInputProps) {
  const [text, setText] = useState("")
  const [dragging, setDragging] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSendText(trimmed)
    setText("")
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    // Auto resize
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPendingFile(file)
    e.target.value = ""
  }

  function handleSendFile() {
    if (!pendingFile || disabled) return
    onSendFile(pendingFile)
    setPendingFile(null)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setPendingFile(file)
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  return (
    <div
      className="relative"
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg-surface)",
        padding: "12px 16px",
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
    >
      {/* Drag overlay */}
      {dragging && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-xl text-sm font-medium animate-fade-in-up"
          style={{
            background: "rgba(91,110,245,0.15)",
            border: "2px dashed var(--accent)",
            color: "var(--accent)",
            backdropFilter: "blur(4px)",
          }}
        >
          松开发送文件 📎
        </div>
      )}

      {/* Pending file preview */}
      {pendingFile && (
        <div
          className="flex items-center gap-3 mb-2 px-3 py-2 rounded-xl animate-fade-in-up"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-light)",
          }}
        >
          <span className="text-lg">📎</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {pendingFile.name}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {formatFileSize(pendingFile.size)}
            </div>
          </div>
          <Button onClick={handleSendFile} disabled={disabled}>
            发送
          </Button>
          <Button onClick={() => setPendingFile(null)}>✕</Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File button */}
        <Button
          onClick={() => fileRef.current?.click()}
          title="发送文件"
          disabled={disabled}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)"
            ;(e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"
            ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"
          }}
        >
          📎
        </Button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none leading-relaxed"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            minHeight: 40,
            maxHeight: 120,
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          placeholder={placeholder ?? (disabled ? "等待 P2P 连接…" : "输入消息，Enter 发送，Shift+Enter 换行")}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)"
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-glow)"
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)"
            e.currentTarget.style.boxShadow = "none"
          }}
        />

        {/* Send button */}
        <Button onClick={handleSend} disabled={!text.trim() || disabled} title="发送 (Enter)">
          ↑
        </Button>
      </div>
    </div>
  )
}
