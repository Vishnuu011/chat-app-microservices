import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Video, VideoOff, PhoneOff, ShieldCheck } from 'lucide-react'
import { useCallStore } from '../../store/callStore.js'
import { useAuthStore } from '../../store/authStore.js'
import { useWebRTC } from '../../hooks/useWebRTC.js'
import { callAPI } from '../../services/api/callService.js'
import { getCallSocket } from '../../services/socket/socketManager.js'
import toast from 'react-hot-toast'

export default function CallInterface() {
  const navigate = useNavigate()
  const {
    activeCall, localStream, remoteStream,
    isMuted, isCameraOff, callDuration,
    toggleMute, toggleCamera, endActiveCall,
    setCallDuration,
  } = useCallStore()
  const { user } = useAuthStore()
  const { initiateCall, stopMedia } = useWebRTC()

  const localVideoRef = useRef()
  const remoteVideoRef = useRef()
  const timerRef = useRef()

  const isVideo = activeCall?.callType === 'video'
  const userId = user?.id || user?._id

  useEffect(() => {
    if (!activeCall) {
      navigate('/calls')
      return
    }

    const isCaller = activeCall.callerId === userId

    if (isCaller) {
      // ✅ Caller: initiateCall handles media + WebRTC + socket emit
      // Pass callId so backend can correlate the socket event
      initiateCall(activeCall.receiverId, activeCall.callType, activeCall.callId)
        .catch(err => {
          console.error(err)
          toast.error("Could not access media devices")
        })
    }
    // ✅ Receiver: media is already started in handleAcceptCall (called from IncomingCallModal)
    // Nothing to do here for the receiver — peerConnection and localStream are already set

  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Fixed: start timer only when remote stream arrives (call actually connected)
  useEffect(() => {
    if (!remoteStream) return
    timerRef.current = setInterval(() => {
      setCallDuration(d => d + 1)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [remoteStream])

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
      remoteVideoRef.current.muted = false
      remoteVideoRef.current.volume = 1.0
      remoteVideoRef.current.play()
        .then(() => console.log("🔊 Remote audio/video playing"))
        .catch(e => console.error("❌ Play error:", e))
    }
  }, [remoteStream])

  useEffect(() => {
    localStream?.getAudioTracks().forEach(t => { t.enabled = !isMuted })
  }, [isMuted, localStream])

  useEffect(() => {
    localStream?.getVideoTracks().forEach(t => { t.enabled = !isCameraOff })
  }, [isCameraOff, localStream])

  async function handleEndCall() {
    stopMedia()
    clearInterval(timerRef.current)

    // ✅ Fixed: target the OTHER party, not always receiverId
    const isCaller = activeCall?.callerId === userId
    const targetUserId = isCaller ? activeCall?.receiverId : activeCall?.callerId

    const callSock = getCallSocket()
    callSock?.emit('endCall', {
      targetUserId,
      callId: activeCall?.callId
    })

    if (activeCall?.callId) {
      await callAPI.endCall(activeCall.callId).catch(() => {})
    }

    endActiveCall()
    navigate('/calls')
  }

  function formatDuration(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="fixed inset-0 bg-surface-950 z-50 flex flex-col">
      {isVideo ? (
        <div className="flex-1 relative bg-surface-900 flex items-center justify-center">
          <video ref={remoteVideoRef} autoPlay playsInline
            className="w-full h-full object-cover" />
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-4xl font-bold text-accent uppercase mb-4">
                {activeCall?.receiverId?.[0] || '?'}
              </div>
              <p className="text-white text-lg font-medium">Connecting…</p>
              <p className="text-surface-200/40 text-sm mt-1">Ringing</p>
            </div>
          )}
          <div className="absolute bottom-4 right-4 w-32 h-24 rounded-xl overflow-hidden border-2 border-accent/30 shadow-xl">
            <video ref={localVideoRef} autoPlay playsInline muted
              className="w-full h-full object-cover" />
            {isCameraOff && (
              <div className="absolute inset-0 bg-surface-900 flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-surface-200/40" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-surface-900 to-surface-950">
          <div className="w-32 h-32 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center text-5xl font-bold text-accent uppercase mb-6 animate-pulse">
            {activeCall?.receiverId?.[0] || '?'}
          </div>
          <p className="text-white text-xl font-semibold mb-2">Voice Call</p>
          <p className="text-surface-200/50 text-sm">
            {remoteStream ? formatDuration(callDuration) : 'Connecting…'}
          </p>
          {/* ✅ audio element for voice — muted=false so remote audio plays */}
          <audio ref={remoteVideoRef} autoPlay playsInline className="hidden" />
        </div>
      )}

      <div className="flex items-center justify-center gap-2 py-2 bg-surface-900/80">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs text-emerald-400/80 font-mono">DTLS-SRTP Encrypted</span>
        {remoteStream && (
          <span className="text-xs text-surface-200/40 ml-2">{formatDuration(callDuration)}</span>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 py-6 bg-surface-900">
        <button onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-surface-800 text-white hover:bg-surface-700'}`}>
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {isVideo && (
          <button onClick={toggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isCameraOff ? 'bg-red-500 text-white' : 'bg-surface-800 text-white hover:bg-surface-700'}`}>
            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        <button onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-lg active:scale-95">
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  )
}