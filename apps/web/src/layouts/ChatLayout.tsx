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
    <div className="flex h-full w-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <UserList onLeave={onLeave} />

      {/* Main chat pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-6 py-3.5 flex-shrink-0"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            minHeight: 60,
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {getHeaderTitle()}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {getHeaderSub()}
            </div>
          </div>

          {/* Connection status badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium"
            style={{
              background: isP2PReady ? 'rgba(62,207,142,0.1)' : 'rgba(139,144,168,0.1)',
              color: isP2PReady ? 'var(--green)' : 'var(--text-muted)',
              border: `1px solid ${isP2PReady ? 'rgba(62,207,142,0.2)' : 'var(--border)'}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: isP2PReady ? 'var(--green)' : 'var(--text-muted)',
                boxShadow: isP2PReady ? '0 0 6px var(--green)' : 'none',
              }}
            />
            {isP2PReady ? 'P2P 就绪' : '未连接'}
          </div>
        </div>

        {/* Messages */}
        <MessageList targetId={selectedPeerId} />

        {/* Input */}
        <MessageInput
          onSendText={text => onSendText(selectedPeerId, text)}
          onSendFile={file => onSendFile(selectedPeerId, file)}
          disabled={inputDisabled}
        />
      </div>
    </div>
  )
}