import { create } from 'zustand'
import { connectChatSocket, connectCallSocket, disconnectSockets } from '../services/socket/socketManager.js'
import { deletePrivateKey } from '../services/encryption/encryption.js'

export const useAuthStore = create((set, get) => ({
  user:         JSON.parse(localStorage.getItem('cc_user') || 'null'),
  token:        localStorage.getItem('cc_token') || null,
  privateKey:   null,   // Uint8Array — never persisted to backend
  publicKey:    null,   // base64 string

  setAuth: (user, token) => {
    localStorage.setItem('cc_user', JSON.stringify(user))
    localStorage.setItem('cc_token', token)
    set({ user, token })
    connectChatSocket(user.id)
    connectCallSocket(user.id)
  },

  setKeys: (privateKey, publicKey) => {
    set({ privateKey, publicKey })
  },

  logout: async () => {
    const { user } = get()
    if (user?.id) await deletePrivateKey(user.id).catch(() => {})
    localStorage.removeItem('cc_token')
    localStorage.removeItem('cc_user')
    disconnectSockets()
    set({ user: null, token: null, privateKey: null, publicKey: null })
  },

  isAuthenticated: () => !!get().token && !!get().user,
}))
