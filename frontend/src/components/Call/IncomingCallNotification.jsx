import React, { useEffect } from 'react'
import { useNavigate }   from 'react-router-dom'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { useCallStore }  from '../../store/callStore.js'
import { useAuthStore }  from '../../store/authStore.js'
import { getCallSocket } from '../../services/socket/socketManager.js'
import { callAPI }       from '../../services/api/callService.js'
import { useWebRTC }     from '../../hooks/useWebRTC.js'

export default function IncomingCallNotification() {
  const navigate   = useNavigate()
  const { incomingCall, clearIncoming, setActiveCall } = useCallStore()
  const { user }   = useAuthStore()
  const { startMedia, createPeerConnection, addStreamToPeer } = useWebRTC()

  if (!incomingCall) return null

  async function acceptCall() {
    const isVideo = incomingCall.callType === 'video'
    try {
      const stream = await startMedia(isVideo)
      const pc = createPeerConnection(incomingCall.callerId)
      addStreamToPeer(stream, pc)
    } catch {}

    setActiveCall({
      ...incomingCall,
      status: 'accepted',
      callerId: incomingCall.callerId,
      receiverId: user.id || user._id,
    })
    clearIncoming()
    navigate('/calls/active')
  }

  function rejectCall() {
    const sock = getCallSocket()
    sock?.emit('rejectCall', { callerId: incomingCall.callerId })
    if (incomingCall.callId) {
      callAPI.endCall(incomingCall.callId).catch(() => {})
    }
    clearIncoming()
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] glass rounded-2xl p-4 shadow-2xl border border-accent/20 w-72 animate-slide-in">
      {/* Ring animation */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-bold text-accent text-lg uppercase animate-ring">
            {incomingCall.callerId?.[0] || '?'}
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping" />
        </div>
        <div>
          <p className="font-semibold text-white text-sm">Incoming {incomingCall.callType === 'video' ? 'Video' : 'Voice'} Call</p>
          <p className="text-xs text-surface-200/50">from {incomingCall.callerId}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={rejectCall}
          className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-all">
          <PhoneOff className="w-4 h-4" /> Decline
        </button>
        <button onClick={acceptCall}
          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-all">
          {incomingCall.callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          Accept
        </button>
      </div>
    </div>
  )
}
