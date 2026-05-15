import { create } from 'zustand';
import { User, ChatItem, Message, IncomingCallData, ActiveCallData, CallHistoryItem } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })(),
  token: localStorage.getItem('token'),
  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  clearAuth: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

interface ChatState {
  chats: ChatItem[];
  activeChat: ChatItem | null;
  messages: Message[];
  onlineUsers: string[];
  typingUsers: Record<string, boolean>;
  setChats: (chats: ChatItem[]) => void;
  setActiveChat: (chat: ChatItem | null) => void;
  setMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  updateMessageSeen: (messageIds: string[]) => void;
  setOnlineUsers: (users: string[]) => void;
  setTyping: (chatId: string, isTyping: boolean) => void;
  updateChatLatest: (chatId: string, text: string, sender: string) => void;
  decrementUnseen: (chatId: string) => void;
  setUnseenZero: (chatId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChat: null,
  messages: [],
  onlineUsers: [],
  typingUsers: {},
  setChats: (chats) => set({ chats }),
  setActiveChat: (chat) => set({ activeChat: chat, messages: [] }),
  setMessages: (msgs) => set({ messages: msgs }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessageSeen: (ids) =>
    set((s) => ({
      messages: s.messages.map((m) => (ids.includes(m.id) ? { ...m, seen: true } : m)),
    })),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  setTyping: (chatId, isTyping) =>
    set((s) => ({ typingUsers: { ...s.typingUsers, [chatId]: isTyping } })),
  updateChatLatest: (chatId, text, sender) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.chat.id === chatId
          ? { ...c, chat: { ...c.chat, latestMessage: { text, sender }, updatedAt: new Date().toISOString() } }
          : c
      ).sort((a, b) => new Date(b.chat.updatedAt || 0).getTime() - new Date(a.chat.updatedAt || 0).getTime()),
    })),
  decrementUnseen: (chatId) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.chat.id === chatId ? { ...c, chat: { ...c.chat, unseencount: Math.max(0, c.chat.unseencount - 1) } } : c
      ),
    })),
  setUnseenZero: (chatId) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.chat.id === chatId ? { ...c, chat: { ...c.chat, unseencount: 0 } } : c
      ),
    })),
}));

interface CallState {
  incomingCall: IncomingCallData | null;
  activeCall: ActiveCallData | null;
  callHistory: CallHistoryItem[];
  setIncomingCall: (call: IncomingCallData | null) => void;
  setActiveCall: (call: ActiveCallData | null) => void;
  setCallHistory: (history: CallHistoryItem[]) => void;
}

export const useCallStore = create<CallState>((set) => ({
  incomingCall: null,
  activeCall: null,
  callHistory: [],
  setIncomingCall: (call) => set({ incomingCall: call }),
  setActiveCall: (call) => set({ activeCall: call }),
  setCallHistory: (history) => set({ callHistory: history }),
}));
