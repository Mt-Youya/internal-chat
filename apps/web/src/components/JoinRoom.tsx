import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { randomName } from '@/utils'
import { Avatar, AvatarFallback } from '@chat/ui'

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
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden bg-gradient-to-br from-background via-background/95 to-primary/5 safe-top safe-bottom">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(91,110,245,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91,110,245,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black, transparent 70%)',
        }}
      />

      <div className="animate-scale-in relative z-10 w-full max-w-md px-4 md:px-6">
        {/* Logo / Title */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center mb-4 md:mb-6">
            <div
              className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center text-4xl md:text-5xl bg-gradient-to-br from-primary via-primary/90 to-secondary shadow-2xl shadow-primary/30 animate-float"
            >
              📡
              <div className="absolute inset-0 rounded-3xl border-2 border-primary/30" />
              <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-xl" />
            </div>
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            发个东西
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            安全 · 快速 · 私密的局域网 P2P 文字与文件传输
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl md:rounded-3xl p-6 md:p-8 flex flex-col gap-4 md:gap-6 bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/20"
        >
          {/* Name preview */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-border/30 mb-2">
            <Avatar size="lg">
              <AvatarFallback>
                {name ? name.charAt(0).toUpperCase() : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-xs font-medium text-muted-foreground mb-1">你的昵称</div>
              <div className="text-base font-semibold text-foreground truncate">
                {name || '请输入昵称'}
              </div>
            </div>
            <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              预览
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary" />
                昵称
                <span className="text-xs text-muted-foreground font-normal">(最多20字)</span>
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 placeholder:text-muted-foreground/60"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="输入你的昵称..."
                maxLength={20}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <span className="size-2 rounded-full bg-secondary" />
                房间 ID
                <span className="text-xs text-muted-foreground font-normal">(最多40字)</span>
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all duration-200 placeholder:text-muted-foreground/60"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  placeholder="输入房间ID，如：team-meeting"
                  maxLength={40}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary font-medium">
                  ID
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className="size-2 rounded-full bg-accent" />
                  房间密码
                  <span className="text-xs text-muted-foreground font-normal">(可选)</span>
                </label>
                <button
                  type="button"
                  className="text-xs px-3 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors duration-200 font-medium"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? '👁️ 隐藏' : '👁️ 显示'}
                </button>
              </div>
              <input
                className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-200 placeholder:text-muted-foreground/60"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="如需密码保护，请输入房间密码"
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm animate-fade-in-up bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2"
              >
                <span className="text-base">⚠️</span>
                <span>
                  {error === 'WRONG_PASSWORD' ? '房间密码错误，请检查后重试' : 
                   error === 'CONNECTION_TIMEOUT' ? '连接超时，请检查网络连接' :
                   error.includes('无法连接到服务器') ? '无法连接到服务器，请确认后端服务已启动' :
                   error}
                </span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold text-base transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
              disabled={loading || !name.trim() || !roomId.trim()}
            >
              {loading ? (
                <>
                  <span className="size-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  连接中…
                </>
              ) : (
                <>
                  <span>🚀 进入房间</span>
                  <span className="text-lg">→</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6 md:mt-8 text-muted-foreground/80 flex flex-col gap-1">
          <span className="flex items-center justify-center gap-2">
            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            数据通过 WebRTC P2P 直传，不经过服务器
          </span>
          <span className="text-xs">端到端加密 · 零数据留存 · 完全私密</span>
        </p>
      </div>
    </div>
  )
}