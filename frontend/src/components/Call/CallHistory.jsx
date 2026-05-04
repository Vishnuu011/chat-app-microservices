import React, { useEffect, useState } from 'react'
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Loader2, Clock } from 'lucide-react'
import { useCallStore }  from '../../store/callStore.js'
import { useAuthStore }  from '../../store/authStore.js'
import { callAPI }       from '../../services/api/callService.js'
import { chatAPI }       from '../../services/api/chatService.js'
import { userAPI }       from '../../services/api/userService.js'
import { useNavigate }   from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function CallHistory() {
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const { callHistory, setCallHistory, setActiveCall } = useCallStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadHistory() }, [])

  async function loadHistory() {
    setLoading(true)
    try {
      const { data } = await callAPI.getHistory()
      setCallHistory(data.calls || [])
    } catch {}
    setLoading(false)
  }

  async function callBack(call) {
    const otherId = call.callerId === (user.id || user._id) ? call.receiverId : call.callerId
    try {
      const { data } = await chatAPI.createChat(otherId)
      const { data: callData } = await callAPI.startCall(otherId, data.chatId, call.callType)
      setActiveCall({ ...callData, callType: call.callType })
      navigate('/calls/active')
    } catch {
      toast.error('Could not start call')
    }
  }

  const myId = user.id || user._id

  function CallIcon({ call }) {
    const isMine = call.callerId === myId
    if (call.status === 'missed' || call.status === 'rejected') return <PhoneMissed className="w-4 h-4 text-red-400" />
    return isMine
      ? <PhoneOutgoing className="w-4 h-4 text-accent" />
      : <PhoneIncoming className="w-4 h-4 text-emerald-400" />
  }

  function formatDur(sec) {
    if (!sec) return '—'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-surface-800">
        <h2 className="text-lg font-semibold text-white">Call History</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-12 text-surface-200/30">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {!loading && callHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-surface-200/30">
            <Phone className="w-10 h-10 opacity-30 mb-3" />
            <p className="text-sm">No call history yet</p>
          </div>
        )}

        {callHistory.map(call => {
          const isMine    = call.callerId === myId
          const otherId   = isMine ? call.receiverId : call.callerId
          const statusColor = call.status === 'ended' ? 'text-emerald-400' : 'text-red-400'

          return (
            <div key={call.callId}
              className="flex items-center gap-3 px-4 py-3 border-b border-surface-800/30 hover:bg-surface-800/30 transition-colors">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-surface-800 flex-shrink-0`}>
                {call.callType === 'video' ? <Video className="w-4 h-4 text-accent" /> : <Phone className="w-4 h-4 text-accent" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <CallIcon call={call} />
                  <p className="font-medium text-white text-sm truncate">{otherId}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs capitalize ${statusColor}`}>{call.status}</span>
                  <span className="text-xs text-surface-200/30">·</span>
                  <span className="text-xs text-surface-200/30">
                    {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
                  </span>
                  {call.duration && (
                    <>
                      <span className="text-xs text-surface-200/30">·</span>
                      <Clock className="w-3 h-3 text-surface-200/30" />
                      <span className="text-xs text-surface-200/30">{formatDur(call.duration)}</span>
                    </>
                  )}
                </div>
              </div>

              <button onClick={() => callBack(call)}
                className="text-xs text-accent hover:text-white bg-accent/10 hover:bg-accent px-3 py-1.5 rounded-lg transition-all">
                Call back
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
