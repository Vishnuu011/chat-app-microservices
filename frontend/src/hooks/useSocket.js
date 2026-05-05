import { useEffect, useRef } from 'react'
import { getChatSocket, getCallSocket } from '../services/socket/socketManager.js'
import { useChatStore } from '../store/chatStore.js'
import { useCallStore } from '../store/callStore.js'
import { useAuthStore } from '../store/authStore.js'
import { decryptMessage } from '../services/encryption/encryption.js'
import { useWebRTC } from './useWebRTC.js'

export function useSocket() {
  const { user, privateKey } = useAuthStore()

  const { addMessage, setOnlineUsers, setTyping, markSeen } = useChatStore()
  const { setIncomingCall, endActiveCall } = useCallStore()

  const { createPeerConnection, startMedia, addStreamToPeer } = useWebRTC()

  const initialized = useRef(false)

  useEffect(() => {
    if (!user || initialized.current) return
    initialized.current = true

    const chatSock = getChatSocket()
    const callSock = getCallSocket()

    // ---------------- CHAT ----------------
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

    // ---------------- CALL ----------------

    // Incoming call notification
    callSock?.on('incomingCall', (data) => {
      console.log("📞 Incoming call:", data)
      setIncomingCall(data)
    })

    // -------- RECEIVER SIDE --------
    callSock?.on('callOffer', async ({ offer, callerId, callType }) => {
      console.log("📥 Offer received from:", callerId)

      const pc = createPeerConnection(callerId)

      const stream = await startMedia(callType === 'video')
      addStreamToPeer(stream, pc)

      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      callSock.emit('answerCall', {
        callerId,
        answer
      })
    })

    // -------- CALLER SIDE --------
    callSock?.on('callAnswer', async ({ answer }) => {
      console.log("✅ Answer received")

      const pc = useCallStore.getState().peerConnection
      if (!pc) return

      await pc.setRemoteDescription(new RTCSessionDescription(answer))
    })

    // -------- ICE --------
    callSock?.on('iceCandidate', async ({ candidate }) => {
      const pc = useCallStore.getState().peerConnection
      if (!pc) return

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.error("ICE error:", err)
      }
    })

    callSock?.on('callRejected', () => endActiveCall())
    callSock?.on('callEnded', () => endActiveCall())

    return () => {
      initialized.current = false
    }
  }, [user, privateKey])
}
