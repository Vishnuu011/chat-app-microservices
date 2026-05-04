import { io } from 'socket.io-client'

let chatSocket = null
let callSocket = null

const CHAT_URL = import.meta.env.VITE_CHAT_SOCKET_URL || 'http://localhost:8002'
const CALL_URL = import.meta.env.VITE_CALL_SOCKET_URL || 'http://localhost:8003'

export function connectChatSocket(userId) {
  if (chatSocket?.connected) return chatSocket
  chatSocket = io(CHAT_URL, {
    query:           { userId },
    transports:      ['websocket'],
    reconnectionAttempts: 5,
  })
  return chatSocket
}

export function connectCallSocket(userId) {
  if (callSocket?.connected) return callSocket
  callSocket = io(CALL_URL, {
    query:           { userId },
    transports:      ['websocket'],
    reconnectionAttempts: 5,
  })
  return callSocket
}

export function getChatSocket()  { return chatSocket }
export function getCallSocket()  { return callSocket }

export function disconnectSockets() {
  chatSocket?.disconnect()
  callSocket?.disconnect()
  chatSocket = null
  callSocket = null
}
