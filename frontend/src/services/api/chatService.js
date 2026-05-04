import { chatClient } from './apiClient.js'

export const chatAPI = {
  createChat:   (otherUserId)        => chatClient.post('/chat/new',         { otherUserId }),
  getAllChats:   ()                   => chatClient.get('/chat/all'),
  getMessages:  (chatId)             => chatClient.get(`/messages/${chatId}`),

  // FormData for sendMessage (supports file uploads)
  sendMessage: (chatId, text, file) => {
    const fd = new FormData()
    fd.append('chatId', chatId)
    if (text) fd.append('text', text)
    if (file) fd.append('File', file)
    return chatClient.post('/message', fd)
  },
}
