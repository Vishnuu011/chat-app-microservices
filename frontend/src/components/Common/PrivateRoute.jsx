import React, { useEffect } from 'react'
import { Navigate }         from 'react-router-dom'
import { useAuthStore }     from '../../store/authStore.js'
import { loadPrivateKey, decryptPrivateKeyWithPassword } from '../../services/encryption/encryption.js'
import { connectChatSocket, connectCallSocket } from '../../services/socket/socketManager.js'

export default function PrivateRoute({ children }) {
  const { user, token, setKeys } = useAuthStore()

  useEffect(() => {
    if (!user) return
    // Reconnect sockets if needed
    connectChatSocket(user.id)
    connectCallSocket(user.id)

    // Reload private key from IndexedDB
    async function loadKey() {
      try {
        const enc = await loadPrivateKey(user.id)
        if (enc) {
          const privBytes = await decryptPrivateKeyWithPassword(enc, user.id)
          // Re-derive public key from private key using nacl
          const { default: nacl } = await import('tweetnacl')
          const { encodeBase64 } = await import('tweetnacl-util')
          const kp = nacl.box.keyPair.fromSecretKey(privBytes)
          setKeys(privBytes, encodeBase64(kp.publicKey))
        }
      } catch {}
    }
    loadKey()
  }, [user])

  if (!token || !user) return <Navigate to="/login" replace />
  return children
}
