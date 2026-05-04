import React, { useEffect, useState } from 'react'
import { useNavigate }   from 'react-router-dom'
import { Search, MessageSquare, UserPlus, Loader2, Lock } from 'lucide-react'
import { userAPI }       from '../../services/api/userService.js'
import { chatAPI }       from '../../services/api/chatService.js'
import { useAuthStore }  from '../../store/authStore.js'
import { useChatStore }  from '../../store/chatStore.js'
import { getKeyFingerprint } from '../../services/encryption/encryption.js'
import toast from 'react-hot-toast'

export default function UserDirectory() {
  const navigate         = useNavigate()
  const { user }         = useAuthStore()
  const { onlineUsers }  = useChatStore()
  const [users,    setUsers]    = useState([])
  const [query,    setQuery]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [creating, setCreating] = useState(null)  // userId being processed

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const { data } = await userAPI.getAllUsers()
      setUsers(data.filter(u => u._id !== (user.id || user._id)))
    } catch {}
    setLoading(false)
  }

  async function openChat(targetUser) {
    setCreating(targetUser._id)
    try {
      const { data } = await chatAPI.createChat(targetUser._id)
      navigate(`/chat/${data.chatId}`)
    } catch {
      toast.error('Could not open chat')
    }
    setCreating(null)
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(query.toLowerCase()) ||
    u.email?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-surface-800">
        <h2 className="text-lg font-semibold text-white mb-3">Contacts</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-200/30" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search users…"
            className="input-field pl-10 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-12 text-surface-200/30">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {!loading && filtered.map(u => {
          const isOnline = onlineUsers.includes(u._id)
          return (
            <div key={u._id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-800/50 transition-colors border-b border-surface-800/30">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-surface-800 border border-accent/20 flex items-center justify-center font-semibold text-accent uppercase">
                  {u.name?.[0] || '?'}
                </div>
                {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-surface-900" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{u.name}</p>
                <p className="text-xs text-surface-200/40 truncate">{u.email}</p>
              </div>

              {/* Actions */}
              <button
                onClick={() => openChat(u)}
                disabled={!!creating}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-white bg-accent/10 hover:bg-accent px-3 py-1.5 rounded-lg transition-all disabled:opacity-40">
                {creating === u._id
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <MessageSquare className="w-3 h-3" />}
                Message
              </button>
            </div>
          )
        })}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-surface-200/30">
            <UserPlus className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No users found</p>
          </div>
        )}
      </div>
    </div>
  )
}
