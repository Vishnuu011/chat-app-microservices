import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Lock, MessageSquare } from 'lucide-react'
import { useChatStore }  from '../../store/chatStore.js'
import { useAuthStore }  from '../../store/authStore.js'
import { chatAPI }       from '../../services/api/chatService.js'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

export default function ChatList() {
  const navigate        = useNavigate()
  const { user }        = useAuthStore()
  const { chats, setChats, activeChat, onlineUsers } = useChatStore()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadChats()
  }, [])

  async function loadChats() {
    setLoading(true)
    try {
      const { data } = await chatAPI.getAllChats()
      setChats(data.chats || [])
    } catch {}
    setLoading(false)
  }

  const filtered = chats.filter(c =>
    c.user.name?.toLowerCase().includes(query.toLowerCase()) ||
    c.user.email?.toLowerCase().includes(query.toLowerCase())
  )

  function openChat(item) {
    navigate(`/chat/${item.chat.id}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-surface-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Messages</h2>
          <span className="lock-badge">🔒 E2EE</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-200/30" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search chats…"
            className="input-field pl-10 py-2 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-12 text-surface-200/40 text-sm">
            Loading…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-surface-200/30">
            <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No chats yet. Start from Contacts.</p>
          </div>
        )}

        {filtered.map(item => {
          const isOnline    = onlineUsers.includes(item.user.id)
          const isActive    = activeChat?.chat.id === item.chat.id
          const latestText  = item.chat.latestMessage?.text || ''
          const unseen      = item.chat.unseencount || 0

          return (
            <button key={item.chat.id}
              onClick={() => openChat(item)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-surface-800/50',
                isActive && 'bg-accent/10 border-l-2 border-accent'
              )}>
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 border border-accent/20 flex items-center justify-center font-semibold text-accent uppercase">
                  {item.user.name?.[0] || '?'}
                </div>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-surface-900" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-sm truncate">{item.user.name}</span>
                  {item.chat.updatedat && (
                    <span className="text-xs text-surface-200/30 flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(item.chat.updatedat), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-surface-200/40 truncate flex items-center gap-1">
                    {latestText ? (
                      <><Lock className="w-2.5 h-2.5 text-emerald-400/60" /> {latestText.substring(0,35)}{latestText.length > 35 ? '…':''}</>
                    ) : (
                      <span className="italic">No messages yet</span>
                    )}
                  </span>
                  {unseen > 0 && (
                    <span className="w-5 h-5 bg-accent rounded-full text-[10px] flex items-center justify-center text-white font-bold flex-shrink-0 ml-2">
                      {unseen > 9 ? '9+' : unseen}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
