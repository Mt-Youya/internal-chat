import { useState, useEffect, FormEvent } from 'react'
import { randomName } from '@/utils'
import { Avatar } from '@chat/ui'

interface JoinRoomProps {
  onJoin: (name: string, roomId: string, password?: string) => Promise<void>
  error?: string | null
}

export function JoinRoom({ onJoin, error }: JoinRoomProps) {
  const [name, setName] = useState(() => {
    return localStorage.getItem('chat_name') || randomName()
  })
  const [roomId, setRoomId] = useState(() => {
    return localStorage.getItem('chat_room') || 'default'
  })
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Check URL hash for room
    const hash = location.hash.replace('#', '')
    if (hash) setRoomId(hash)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !roomId.trim()) return
    setLoading(true)
    localStorage.setItem('chat_name', name.trim())
    localStorage.setItem('chat_room', roomId.trim())
    try {
      await onJoin(name.trim(), roomId.trim(), password || undefined)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex items-center justify-center w-full h-full noise overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(91,110,245,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91,110,245,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          left: '50%',
          top: '40%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(91,110,245,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="animate-scale-in relative z-10 w-full max-w-sm px-4">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-4">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
              style={{
                background: 'linear-gradient(135deg, #5b6ef5, #3ecf8e)',
                boxShadow: '0 8px 32px rgba(91,110,245,0.4)',
              }}
            >
              📡
            </div>
          </div>
          <h1
            className="text-3xl font-semibold tracking-tight mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            发个东西
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            局域网 P2P 文字 / 文件传输
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}
        >
          {/* Name preview */}
          <div className="flex items-center gap-3 mb-1">
            <Avatar name={name || '?'} size="md" />
            <div>
              <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>你的昵称</div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {name || '请输入昵称'}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                昵称
              </label>
              <input
                className="input-field"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="你叫什么？"
                maxLength={20}
                required
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                房间 ID
              </label>
              <input
                className="input-field"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                placeholder="default"
                maxLength={40}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  房间密码 <span style={{ color: 'var(--text-muted)' }}>(可选)</span>
                </label>
                <button
                  type="button"
                  className="text-xs"
                  style={{ color: 'var(--accent)' }}
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? '隐藏' : '显示'}
                </button>
              </div>
              <input
                className="input-field"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="无密码则留空"
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-2.5 text-sm animate-fade-in-up"
                style={{ background: 'rgba(244,107,93,0.1)', color: 'var(--red)', border: '1px solid rgba(244,107,93,0.2)' }}
              >
                {error === 'WRONG_PASSWORD' ? '❌ 房间密码错误' : `⚠️ ${error}`}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary mt-1"
              disabled={loading || !name.trim() || !roomId.trim()}
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  连接中…
                </>
              ) : (
                '进入房间 →'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
          数据通过 WebRTC P2P 直传，不经过服务器
        </p>
      </div>
    </div>
  )
}