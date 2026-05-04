import { useEffect, useRef } from 'react'
import { getChatSocket, getCallSocket } from '../services/socket/socketManager.js'
import { useChatStore }  from '../store/chatStore.js'
import { useCallStore }  from '../store/callStore.js'
import { useAuthStore }  from '../store/authStore.js'
import { decryptMessage } from '../services/encryption/encryption.js'

export function useSocket() {
  const { user, privateKey }  = useAuthStore()
  const { addMessage, setOnlineUsers, setTyping, markSeen } = useChatStore()
  const { setIncomingCall, setRemoteStream, setPeerConn, endActiveCall } = useCallStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (!user || initialized.current) return
    initialized.current = true

    const chatSock = getChatSocket()
    const callSock = getCallSocket()

    // ── Chat events ──────────────────────────────────────────────────────────
    chatSock?.on('getOnlineUsers', ids => setOnlineUsers(ids))

    chatSock?.on('newMessage', async (msg) => {
      let decrypted = { ...msg }
      if (msg.encryptedPayload && privateKey) {
        try {
          const plain = await decryptMessage(msg.encryptedPayload, privateKey)
          decrypted._preview = plain.substring(0, 40)
          decrypted.text = plain
          decrypted.encrypted = true
        } catch {
          decrypted.text = '🔒 [Encrypted message]'
          decrypted.decryptError = true
        }
      }
      addMessage(decrypted)
    })

    chatSock?.on('userTyping',        ({ chatId }) => setTyping(chatId, true))
    chatSock?.on('userStoppedTyping', ({ chatId }) => setTyping(chatId, false))
    chatSock?.on('messageSeen',       ({ chatId }) => markSeen(chatId))

    // ── Call events ──────────────────────────────────────────────────────────
    callSock?.on('incomingCall', (data) => setIncomingCall(data))

    callSock?.on('callOffer', async ({ offer, callerId }) => {
      const pc = useCallStore.getState().peerConnection
      if (!pc) return
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      callSock.emit('answerCall', { callerId, answer })
    })

    callSock?.on('callAnswer', async ({ answer }) => {
      const pc = useCallStore.getState().peerConnection
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer))
    })

    callSock?.on('iceCandidate', async ({ candidate }) => {
      const pc = useCallStore.getState().peerConnection
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
      }
    })

    callSock?.on('callRejected', () => endActiveCall())
    callSock?.on('callEnded',    () => endActiveCall())

    return () => {
      initialized.current = false
    }
  }, [user, privateKey])
}
