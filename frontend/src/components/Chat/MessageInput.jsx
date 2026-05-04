import React, { useState, useRef } from 'react'
import { Send, Paperclip, X, Lock } from 'lucide-react'
import { getChatSocket } from '../../services/socket/socketManager.js'
import { useAuthStore }  from '../../store/authStore.js'
import { encryptMessage } from '../../services/encryption/encryption.js'
import { chatAPI }       from '../../services/api/chatService.js'
import { userAPI }       from '../../services/api/userService.js'
import toast             from 'react-hot-toast'

export default function MessageInput({ chatId, receiverId, onSent }) {
  const { user, privateKey } = useAuthStore()
  const [text,     setText]     = useState('')
  const [file,     setFile]     = useState(null)
  const [sending,  setSending]  = useState(false)
  const [typing,   setTyping]   = useState(false)
  const typingTimer = useRef(null)
  const fileRef     = useRef()

  function handleTextChange(e) {
    setText(e.target.value)
    const sock = getChatSocket()

    if (!typing) {
      setTyping(true)
      sock?.emit('typing', { chatId, userId: user.id })
    }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      setTyping(false)
      sock?.emit('stopTyping', { chatId, userId: user.id })
    }, 1500)
  }

  async function handleSend(e) {
    e.preventDefault()
    if ((!text.trim() && !file) || sending) return

    setSending(true)
    try {
      let sendText = text.trim()

      // Encrypt text message if we have recipient's public key
      if (sendText && receiverId) {
        try {
          const { data: keyData } = await userAPI.getPublicKey(receiverId)
          if (keyData?.publicKey) {
            const payload = await encryptMessage(sendText, keyData.publicKey)
            // Serialize encrypted payload as JSON string for backend storage
            sendText = JSON.stringify({ __e2ee: true, ...payload })
          }
        } catch {
          // If key fetch fails, send as-is (no E2EE for this message)
        }
      }

      await chatAPI.sendMessage(chatId, sendText, file)
      setText('')
      setFile(null)
      onSent?.()
    } catch (err) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  return (
    <form onSubmit={handleSend} className="flex items-end gap-2 p-3 border-t border-surface-800 bg-surface-950">
      {/* File preview */}
      {file && (
        <div className="absolute bottom-16 left-4 glass rounded-xl px-3 py-2 flex items-center gap-2 text-sm">
          <span className="truncate max-w-xs text-surface-200/80">{file.name}</span>
          <button type="button" onClick={() => setFile(null)} className="text-surface-200/40 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Attach */}
      <button type="button" onClick={() => fileRef.current?.click()}
        className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-surface-200/40 hover:text-accent hover:bg-accent/10 transition-all">
        <Paperclip className="w-4 h-4" />
      </button>
      <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />

      {/* Input */}
      <div className="flex-1 relative">
        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
          placeholder="Type a message…"
          rows={1}
          className="input-field resize-none pr-10 py-2.5 text-sm min-h-[40px] max-h-[120px] overflow-y-auto"
          style={{ height: 'auto' }}
        />
        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-400/50" />
      </div>

      {/* Send */}
      <button type="submit" disabled={!text.trim() && !file}
        className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-accent text-white disabled:opacity-30 hover:bg-accent-dark transition-all active:scale-95">
        <Send className="w-4 h-4" />
      </button>
    </form>
  )
}
