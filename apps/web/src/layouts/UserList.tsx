import { useChatStore } from "../stores/chat"
import { Avatar, AvatarFallback } from "@chat/ui"
import type { PeerStatus } from "../types"
import { getInitials } from "@/utils"

interface UserListProps {
  onLeave: () => void
}

function StatusLabel({ status }: { status: PeerStatus }) {
  const map: Record<PeerStatus, { label: string; color: string; bg: string }> = {
    connected: { 
      label: "已连接", 
      color: "text-green-500", 
      bg: "bg-green-500" 
    },
    connecting: { 
      label: "连接中", 
      color: "text-amber-500", 
      bg: "bg-amber-500" 
    },
    disconnected: { 
      label: "已断开", 
      color: "text-gray-500", 
      bg: "bg-gray-500" 
    },
    failed: { 
      label: "连接失败", 
      color: "text-red-500", 
      bg: "bg-red-500" 
    },
  }
  
  const { label, color, bg } = map[status]
  
  return (
    <div className="relative group" title={label}>
      <span 
        className={`size-2.5 rounded-full ${bg} ring-2 ring-background ${status === 'connected' ? 'animate-pulse' : ''}`}
      />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded-lg bg-foreground text-background opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 size-2 bg-foreground rotate-45" />
      </div>
    </div>
  )
}

export function UserList({ onLeave }: UserListProps) {
  const { selfId, selfName, peers, selectedPeerId, setSelectedPeer, roomId } = useChatStore()

  const peerList = Array.from(peers.values())
  const onlineCount = peerList.filter(p => p.status === 'connected').length

  return (
    <aside
      className="flex flex-col h-full w-64 min-w-64 bg-gradient-to-b from-background/95 via-background/90 to-background/85 backdrop-blur-sm border-r border-border/50 shadow-lg"
    >
      {/* Room header */}
      <div className="flex flex-col gap-2 px-5 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-foreground/80">
              房间
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            {onlineCount + 1} 在线
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-mono px-3 py-1.5 rounded-xl truncate bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-primary font-semibold shadow-sm"
          >
            # {roomId}
          </span>
          <div className="text-xs px-2 py-1 rounded-lg bg-background/50 border border-border/50 text-muted-foreground">
            ID
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-1">
          {peerList.length === 0 ? '等待其他人加入...' : `${peerList.length} 位成员已加入`}
        </p>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto scrollbar-none py-3 px-3">
        {/* All / Broadcast */}
        <button
          type="button"
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 text-left transition-all duration-200 cursor-pointer group ${
            selectedPeerId === null 
              ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 shadow-md' 
              : 'hover:bg-muted/50 border border-transparent hover:border-border/50'
          }`}
          onClick={() => setSelectedPeer(null)}
        >
          <div
            className={`size-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 transition-all duration-300 ${
              selectedPeerId === null 
                ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg scale-110' 
                : 'bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground group-hover:scale-105'
            }`}
          >
            🌐
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate text-foreground">
              全体广播
            </div>
            <div className="text-xs truncate text-muted-foreground">
              消息将发送给所有在线成员
            </div>
          </div>
          {selectedPeerId === null && (
            <div className="size-2 rounded-full bg-primary animate-pulse" />
          )}
        </button>

        {/* Section label */}
        {peerList.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 mb-1">
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-secondary" />
              <span className="text-xs font-semibold text-foreground/80">
                私聊成员
              </span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">
              {peerList.length}
            </span>
          </div>
        )}

        {peerList.map((peer) => (
          <button
            type="button"
            key={peer.user.id}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1.5 text-left transition-all duration-200 cursor-pointer group ${
              selectedPeerId === peer.user.id 
                ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 shadow-md' 
                : 'hover:bg-muted/50 border border-transparent hover:border-border/50'
            }`}
            onClick={() => setSelectedPeer(peer.user.id)}
          >
            <div className="relative flex-shrink-0">
              <Avatar size="sm" className="group-hover:scale-105 transition-transform duration-200">
                <AvatarFallback>
                  {getInitials(peer.user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5">
                <StatusLabel status={peer.status} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate text-foreground flex items-center gap-1.5">
                {peer.user.name}
                {peer.status === 'connected' && (
                  <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>
              <div className={`text-xs truncate ${
                peer.status === 'connected' ? 'text-green-600 dark:text-green-400' :
                peer.status === 'connecting' ? 'text-amber-600 dark:text-amber-400' :
                peer.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                'text-muted-foreground'
              }`}>
                {peer.status === "connected"
                  ? "P2P 直连 · 端到端加密"
                  : peer.status === "connecting"
                    ? "建立连接中…"
                    : peer.status === "failed"
                      ? "连接失败"
                      : "已断开"}
              </div>
            </div>
            {selectedPeerId === peer.user.id && (
              <div className="size-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        ))}

        {peerList.length === 0 && (
          <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
            <div className="size-16 rounded-2xl flex items-center justify-center mb-3 bg-gradient-to-br from-muted to-muted/50 border border-border/50">
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              暂无其他成员
            </p>
            <p className="text-xs text-muted-foreground">
              邀请其他人加入房间开始私聊
            </p>
          </div>
        )}
      </div>

      {/* Self info + leave */}
      <div className="px-4 py-3 flex items-center gap-3 border-t border-border/50 bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm">
        <Avatar size="sm" className="ring-2 ring-primary/20">
          <AvatarFallback>
            {getInitials(selfName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate text-foreground flex items-center gap-1.5">
            {selfName}
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="text-xs text-primary font-medium">
            我 · 在线
          </div>
        </div>
        <button
          type="button"
          onClick={onLeave}
          title="离开房间"
          className="text-xs px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer flex-shrink-0 bg-gradient-to-r from-destructive/10 to-destructive/5 hover:from-destructive/20 hover:to-destructive/10 text-destructive border border-destructive/20 hover:border-destructive/30 font-medium"
        >
          离开
        </button>
      </div>
    </aside>
  )
}
