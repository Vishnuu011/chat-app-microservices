import { callClient } from './apiClient.js'

export const callAPI = {
  startCall:   (receiverId, chatId, callType) =>
    callClient.post('/start-call', { receiverId, chatId, callType }),
  endCall:     (callId) => callClient.post(`/end-call/${callId}`),
  getHistory:  ()       => callClient.get('/history'),
}
