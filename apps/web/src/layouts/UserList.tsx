import { useChatStore } from "../stores/chat"
import { Avatar } from "@chat/ui"
import type { PeerStatus } from "../types"

interface UserListProps {
  onLeave: () => void
}

function StatusLabel({ status }: { status: PeerStatus }) {
  const map: Record<PeerStatus, string> = {
    connected: "已连接",
    connecting: "连接中",
    disconnected: "已断开",
    failed: "连接失败",
  }
  return <span className={`status-dot ${status}`} title={map[status]} />
}

export function UserList({ onLeave }: UserListProps) {
  const { selfId, selfName, peers, selectedPeerId, setSelectedPeer, roomId } = useChatStore()

  const peerList = Array.from(peers.values())

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        width: 220,
        minWidth: 220,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Room header */}
      <div className="flex flex-col gap-0.5 px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-lg truncate"
            style={{
              background: "var(--accent-glow)",
              color: "var(--accent)",
              border: "1px solid rgba(91,110,245,0.3)",
              maxWidth: "100%",
            }}
          >
            # {roomId}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {peerList.length + 1} 人在线
        </p>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {/* All / Broadcast */}
        <button
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 text-left transition-all duration-150 cursor-pointer"
          style={{
            background: selectedPeerId === null ? "var(--bg-hover)" : "transparent",
            border: selectedPeerId === null ? "1px solid var(--border-light)" : "1px solid transparent",
          }}
          onClick={() => setSelectedPeer(null)}
        >
          <div
            className="w-8 h-8 rounded-2xl flex items-center justify-center text-sm flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #5b6ef5 0%, #3ecf8e 100%)",
              boxShadow: selectedPeerId === null ? "0 0 12px rgba(91,110,245,0.4)" : "none",
            }}
          >
            🌐
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              全体广播
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              所有人可见
            </div>
          </div>
        </button>

        {/* Section label */}
        {peerList.length > 0 && (
          <div className="px-3 py-1.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            私聊
          </div>
        )}

        {peerList.map((peer) => (
          <button
            key={peer.user.id}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all duration-150 cursor-pointer group"
            style={{
              background: selectedPeerId === peer.user.id ? "var(--bg-hover)" : "transparent",
              border: selectedPeerId === peer.user.id ? "1px solid var(--border-light)" : "1px solid transparent",
            }}
            onClick={() => setSelectedPeer(peer.user.id)}
          >
            <div className="relative flex-shrink-0">
              <Avatar name={peer.user.name} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5" style={{ display: "block" }}>
                <StatusLabel status={peer.status} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {peer.user.name}
              </div>
              <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                {peer.status === "connected"
                  ? "P2P 已就绪"
                  : peer.status === "connecting"
                    ? "建立连接中…"
                    : peer.status === "failed"
                      ? "连接失败"
                      : "已断开"}
              </div>
            </div>
          </button>
        ))}

        {peerList.length === 0 && (
          <div className="px-3 py-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            等待其他人加入…
          </div>
        )}
      </div>

      {/* Self info + leave */}
      <div className="px-3 py-3 flex items-center gap-2.5" style={{ borderTop: "1px solid var(--border)" }}>
        <Avatar name={selfName} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {selfName}
          </div>
          <div className="text-xs" style={{ color: "var(--green)" }}>
            ● 我
          </div>
        </div>
        <button
          onClick={onLeave}
          title="离开房间"
          className="text-xs px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex-shrink-0"
          style={{
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = "var(--red)"
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--red)"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"
          }}
        >
          离开
        </button>
      </div>
    </aside>
  )
}
