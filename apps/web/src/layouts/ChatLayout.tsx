import { useChatStore } from '../stores/chat'
import { UserList } from './UserList'
import { MessageList } from '@/components/MessageList'
import { MessageInput } from '@/components/MessageInput'

interface ChatLayoutProps {
  onSendText: (targetId: string | null, text: string) => void
  onSendFile: (targetId: string | null, file: File) => void
  onLeave: () => void
}

export function ChatLayout({ onSendText, onSendFile, onLeave }: ChatLayoutProps) {
  const { selectedPeerId, peers } = useChatStore()

  const selectedPeer = selectedPeerId ? peers.get(selectedPeerId) : null
  const isP2PReady = selectedPeerId
    ? selectedPeer?.status === 'connected'
    : Array.from(peers.values()).some(p => p.status === 'connected')

  const inputDisabled = !isP2PReady

  function getHeaderTitle() {
    if (!selectedPeerId) return '全体广播'
    return selectedPeer?.user.name ?? '未知用户'
  }

  function getHeaderSub() {
    if (!selectedPeerId) {
      const count = Array.from(peers.values()).filter(p => p.status === 'connected').length
      return count > 0 ? `${count} 人已连接` : '等待连接…'
    }
    const st = selectedPeer?.status
    if (st === 'connected') return 'P2P 直连 · 端到端加密'
    if (st === 'connecting') return '建立 P2P 连接中…'
    if (st === 'failed') return '连接失败'
    return '已断开'
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-gradient-to-br from-background via-background/95 to-muted/20">
      {/* Sidebar for desktop, drawer for mobile */}
      <div className="hidden md:flex flex-col w-64 border-r border-border/50 bg-background/80 backdrop-blur-sm">
        <UserList onLeave={onLeave} />
      </div>

      {/* Mobile sidebar toggle */}
      <button
        type="button"
        className="md:hidden fixed top-4 left-4 z-50 size-10 rounded-full bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg flex items-center justify-center hover:bg-background transition-all duration-200"
        onClick={() => {
          // TODO: Implement mobile sidebar toggle
          console.log('Toggle mobile sidebar');
        }}
      >
        <span className="text-lg">☰</span>
      </button>

      {/* Main chat pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden safe-top safe-bottom">
        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-3.5 flex-shrink-0 bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40"
        >
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm md:text-base text-foreground">
              {getHeaderTitle()}
            </div>
            <div className="text-xs md:text-sm mt-0.5 text-muted-foreground">
              {getHeaderSub()}
            </div>
          </div>

          {/* Connection status badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              isP2PReady
                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isP2PReady
                  ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                  : 'bg-muted-foreground'
              }`}
            />
            <span className="hidden sm:inline">
              {isP2PReady ? 'P2P 就绪' : '未连接'}
            </span>
            <span className="sm:hidden">
              {isP2PReady ? '✓' : '●'}
            </span>
          </div>

          {/* Mobile leave button */}
          <button
            type="button"
            className="md:hidden ml-2 size-9 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors duration-200 flex items-center justify-center"
            onClick={onLeave}
            title="离开房间"
          >
            <span className="text-sm">离开</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-4 md:px-6 py-4">
          <MessageList targetId={selectedPeerId} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 md:px-6 py-3 md:py-4 safe-bottom">
          <MessageInput
            onSendText={text => onSendText(selectedPeerId, text)}
            onSendFile={file => onSendFile(selectedPeerId, file)}
            disabled={inputDisabled}
          />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 opacity-0 pointer-events-none transition-opacity duration-300">
        {/* Mobile sidebar content would go here */}
      </div>
    </div>
  )
}