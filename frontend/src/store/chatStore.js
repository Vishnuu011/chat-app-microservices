import { create } from 'zustand'

export const useChatStore = create((set, get) => ({
  chats:          [],
  activeChat:     null,   // { chat, user }
  messages:       [],     // decrypted message objects for active chat
  onlineUsers:    [],
  typingUsers:    {},     // { chatId: bool }

  setChats:        (chats)        => set({ chats }),
  setActiveChat:   (chat)         => set({ activeChat: chat, messages: [] }),
  setMessages:     (messages)     => set({ messages }),
  setOnlineUsers:  (ids)          => set({ onlineUsers: ids }),

  addMessage: (msg) => {
    const { messages, activeChat } = get()
    if (activeChat && msg.chatId === activeChat.chat.id) {
      set({ messages: [...messages, msg] })
    }
    // Update latest message in chat list
    set(s => ({
      chats: s.chats.map(c =>
        c.chat.id === msg.chatId
          ? { ...c, chat: { ...c.chat, latestMessage: { text: msg._preview || msg.text || 'file', sender: msg.sender } } }
          : c
      )
    }))
  },

  setTyping: (chatId, val) => set(s => ({ typingUsers: { ...s.typingUsers, [chatId]: val } })),

  markSeen: (chatId) => {
    set(s => ({
      chats: s.chats.map(c =>
        c.chat.id === chatId ? { ...c, chat: { ...c.chat, unseencount: 0 } } : c
      )
    }))
  },
}))
