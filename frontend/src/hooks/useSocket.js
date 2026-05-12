import { useEffect, useRef } from 'react'
import { getChatSocket, getCallSocket } from '../services/socket/socketManager.js'
import { useChatStore } from '../store/chatStore.js'
import { useCallStore } from '../store/callStore.js'
import { useAuthStore } from '../store/authStore.js'
import { decryptMessage } from '../services/encryption/encryption.js'
import { getCallSocket as _getCallSocket } from '../services/socket/socketManager.js'

export function useSocket() {
  const { user, privateKey } = useAuthStore()
  const { addMessage, setOnlineUsers, setTyping, markSeen } = useChatStore()
  const { setIncomingCall, endActiveCall, setPeerConn, setLocalStream, setRemoteStream } = useCallStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (!user || initialized.current) return
    initialized.current = true

    const chatSock = getChatSocket()
    const callSock = getCallSocket()

    // ─── CHAT ────────────────────────────────────────────────
    chatSock?.on('getOnlineUsers', ids => setOnlineUsers(ids))

    chatSock?.on('newMessage', async (msg) => {
      let decrypted = { ...msg }
      if (msg.encryptedPayload && privateKey) {
        try {
          const plain = await decryptMessage(msg.encryptedPayload, privateKey)
          decrypted.text = plain
        } catch {
          decrypted.text = '🔒 Encrypted message'
        }
      }
      addMessage(decrypted)
    })

    chatSock?.on('userTyping', ({ chatId }) => setTyping(chatId, true))
    chatSock?.on('userStoppedTyping', ({ chatId }) => setTyping(chatId, false))
    chatSock?.on('messageSeen', ({ chatId }) => markSeen(chatId))

    // ─── CALL ─────────────────────────────────────────────────

    // ✅ Fixed: single incomingCall event now contains the offer too
    callSock?.off('incomingCall')
    callSock?.on('incomingCall', (data) => {
      console.log("📞 Incoming call:", data)
      // Store the full data (callId, callerId, receiverId, offer, callType)
      setIncomingCall(data)
    })

    // ✅ REMOVED: callOffer listener — offer is now inside incomingCall

    // ─── RECEIVER SIDE: answer when user accepts ──────────────
    // This is triggered by the IncomingCallModal when user taps "Accept"
    // Logic moved to a separate handler — see handleAcceptCall below
    // (keeping socket.js clean — it only sets store state here)

    // ─── CALLER SIDE: receive answer ─────────────────────────
    // ✅ Fixed: event renamed from callAnswer → callAnswered
    callSock?.off('callAnswered')
    callSock?.on('callAnswered', async ({ callId, answer }) => {
      console.log("✅ Answer received for call:", callId)
      const pc = useCallStore.getState().peerConnection
      if (!pc) return

      if (pc.signalingState === "have-local-offer" && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
        console.log("✅ Remote description set on caller")
        // ✅ Fixed: flush any ICE candidates that arrived before remote desc
        flushPendingCandidates(pc)
      }
    })

    // ─── ICE ──────────────────────────────────────────────────
    // ✅ Fixed: pendingCandidates queue is now actually flushed
    callSock?.off('iceCandidate')
    callSock?.on('iceCandidate', async ({ candidate }) => {
      const pc = useCallStore.getState().peerConnection
      if (!pc || !candidate) return

      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          console.error("ICE add error:", err)
        }
      } else {
        // Queue it — will be flushed after setRemoteDescription
        pendingCandidatesRef.current.push(candidate)
        console.log("⏳ ICE candidate queued, total:", pendingCandidatesRef.current.length)
      }
    })

    callSock?.off('callRejected')
    callSock?.on('callRejected', ({ callId }) => {
      console.log("❌ Call rejected:", callId)
      endActiveCall()
    })

    callSock?.off('callEnded')
    callSock?.on('callEnded', ({ callId, duration }) => {
      console.log("📵 Call ended:", callId, "duration:", duration)
      endActiveCall()
    })

    callSock?.off('callError')
    callSock?.on('callError', ({ message }) => {
      console.error("📵 Call error:", message)
    })

    return () => {
      initialized.current = false
    }
  }, [user, privateKey])
}

// ✅ Module-level ref so it persists across renders
const pendingCandidatesRef = { current: [] }

export async function flushPendingCandidates(pc) {
  console.log("🔄 Flushing", pendingCandidatesRef.current.length, "pending ICE candidates")
  for (const candidate of pendingCandidatesRef.current) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.error("ICE flush error:", err)
    }
  }
  pendingCandidatesRef.current = []
}

// ✅ Call this from IncomingCallModal when user accepts
// This replaces the callOffer handler that was incorrectly inside useSocket
export async function handleAcceptCall({ offer, callerId, callType, callId }) {
  const callSock = _getCallSocket()
  const { setPeerConn, setLocalStream } = useCallStore.getState()

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" }
    ]
  }

  const pc = new RTCPeerConnection(ICE_SERVERS)

  pc.onicecandidate = (event) => {
    if (!event.candidate) return
    callSock?.emit('iceCandidate', { targetUserId: callerId, candidate: event.candidate })
  }

  pc.ontrack = (e) => {
    if (e.streams?.[0]) useCallStore.getState().setRemoteStream(e.streams[0])
  }

  setPeerConn(pc)

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: callType === 'video'
  })
  setLocalStream(stream)
  stream.getTracks().forEach(track => pc.addTrack(track, stream))

  await pc.setRemoteDescription(new RTCSessionDescription(offer))

  // Flush any ICE that arrived before we set remote desc
  await flushPendingCandidates(pc)

  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)

  callSock?.emit('answerCall', { callerId, callId, answer })
  console.log("✅ Answer sent to caller", callerId)
}