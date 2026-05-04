import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Video, ShieldCheck, Lock, MoreVertical, Loader2 } from 'lucide-react'
import { useChatStore }  from '../../store/chatStore.js'
import { useAuthStore }  from '../../store/authStore.js'
import { useCallStore }  from '../../store/callStore.js'
import { chatAPI }       from '../../services/api/chatService.js'
import { callAPI }       from '../../services/api/callService.js'
import { getChatSocket } from '../../services/socket/socketManager.js'
import { decryptMessage } from '../../services/encryption/encryption.js'
import MessageBubble     from './MessageBubble.jsx'
import MessageInput      from './MessageInput.jsx'
import toast             from 'react-hot-toast'
import clsx              from 'clsx'

export default function ChatWindow() {
  const { chatId }      = useParams()
  const navigate        = useNavigate()
  const { user, privateKey } = useAuthStore()
  const { messages, setMessages, setActiveChat, typingUsers, onlineUsers } = useChatStore()
  const { setActiveCall } = useCallStore()
  const [chatInfo, setChatInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef()

  useEffect(() => {
    if (!chatId) return
    loadMessages()
    const sock = getChatSocket()
    sock?.emit('joinChat', chatId)
    return () => { sock?.emit('leaveChat', chatId) }
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    setLoading(true)
    try {
      const { data } = await chatAPI.getMessages(chatId)
      const { messages: rawMsgs, user: otherUser } = data

      // Decrypt all messages
      const decrypted = await Promise.all(
        rawMsgs.map(async msg => {
          if (!msg.text) return msg
          try {
            const parsed = JSON.parse(msg.text)
            if (parsed.__e2ee && privateKey) {
              const plain = await decryptMessage(parsed, privateKey)
              return { ...msg, text: plain, encrypted: true }
            }
          } catch {}
          return msg
        })
      )

      setMessages(decrypted)
      setChatInfo(otherUser)
      setActiveChat({ chat: { id: chatId, users: [] }, user: otherUser })
    } catch {
      toast.error('Failed to load messages')
    }
    setLoading(false)
  }

  async function startCall(type) {
    try {
      const { data } = await callAPI.startCall(chatInfo?._id || chatInfo?.id, chatId, type)
      setActiveCall({ ...data, callType: type })
      navigate('/calls/active')
    } catch (err) {
      toast.error('Could not start call')
    }
  }

  const isOnline   = chatInfo && onlineUsers.includes(chatInfo._id || chatInfo.id)
  const isTyping   = typingUsers[chatId]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-800 bg-surface-900">
        <button onClick={() => navigate('/')} className="md:hidden text-surface-200/40 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {chatInfo ? (
          <>
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center font-semibold text-accent uppercase text-sm">
                {chatInfo.name?.[0] || '?'}
              </div>
              {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-surface-900" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">{chatInfo.name}</p>
              <p className="text-xs text-surface-200/40">
                {isTyping ? <span className="text-accent animate-pulse">typing…</span> : isOnline ? 'online' : 'offline'}
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 h-9 bg-surface-800 rounded animate-pulse" />
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button onClick={() => startCall('audio')} title="Voice call"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-surface-200/50 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all">
            <Phone className="w-4 h-4" />
          </button>
          <button onClick={() => startCall('video')} title="Video call"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-surface-200/50 hover:text-accent hover:bg-accent/10 transition-all">
            <Video className="w-4 h-4" />
          </button>
          <div title="E2E Encrypted" className="w-8 h-8 flex items-center justify-center text-emerald-400/60">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center h-full text-surface-200/30">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-surface-200/30 gap-3">
            <Lock className="w-8 h-8 opacity-30" />
            <p className="text-sm">Messages are end-to-end encrypted</p>
            <p className="text-xs opacity-60">Say hello!</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={msg.sender === (user.id || user._id)}
              senderName={chatInfo?.name}
            />
          ))
        )}

        {isTyping && (
          <div className="flex items-end gap-2 mb-2">
            <div className="px-4 py-3 bg-surface-800 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 bg-surface-200/40 rounded-full animate-pulse-dot"
                    style={{ animationDelay: `${i*0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        chatId={chatId}
        receiverId={chatInfo?._id || chatInfo?.id}
        onSent={loadMessages}
      />
    </div>
  )
}
