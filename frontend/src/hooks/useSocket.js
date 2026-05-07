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
    callSock?.off("incomingCall")
    callSock?.on('incomingCall', (data) => {
      console.log("📞 Incoming call:", data)
      setIncomingCall(data)
    })

    // -------- RECEIVER SIDE --------
    callSock?.off("callOffer")
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
    callSock?.off("callAnswer")
    callSock?.on('callAnswer', async ({ answer }) => {
      console.log("✅ Answer received")

      const pc = useCallStore.getState().peerConnection
      if (!pc) return

      if (
        pc.signalingState === "have-local-offer" &&
        !pc.currentRemoteDescription
      ) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
      }
    })

    // -------- ICE --------
    const pendingCandidates = []
    callSock?.off("iceCandidate")
    callSock?.on('iceCandidate', async ({ candidate }) => {

      const pc = useCallStore.getState().peerConnection
      if (!pc) return

      if (pc.remoteDescription) {

        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          console.error("ICE error:", err)
        }

      } else {
        pendingCandidates.push(candidate)
      }

    })
    callSock?.off('callRejected')
    callSock?.on('callRejected', () => endActiveCall())
    callSock?.off('callEnded')
    callSock?.on('callEnded', () => endActiveCall())

    return () => {
      initialized.current = false

      // chatSock?.off('getOnlineUsers')
      // chatSock?.off('newMessage')
      // chatSock?.off('userTyping')
      // chatSock?.off('userStoppedTyping')
      // chatSock?.off('messageSeen')

      // callSock?.off('incomingCall')
      // callSock?.off('callOffer')
      // callSock?.off('callAnswer')
      // callSock?.off('iceCandidate')
      // callSock?.off('callRejected')
      // callSock?.off('callEnded')
    }
  }, [user, privateKey])
}
