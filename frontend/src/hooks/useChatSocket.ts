import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore, useChatStore } from '../store';
import { Message } from '../types';

let chatSocket: Socket | null = null;

export const getChatSocket = () => chatSocket;

export const useChatSocket = () => {
  const { user } = useAuthStore();
  const { setOnlineUsers, addMessage, updateMessageSeen, setTyping, updateChatLatest, activeChat } = useChatStore();
  const activeChatRef = useRef(activeChat);
  activeChatRef.current = activeChat;

  useEffect(() => {
    if (!user) return;

    const CHAT_SOCKET_URL = import.meta.env.VITE_CHAT_SOCKET || 'http://localhost:8002';

    chatSocket = io(CHAT_SOCKET_URL, {
      query: { userId: user._id || user.id },
      transports: ['websocket'],
    });

    chatSocket.on('connect', () => {
      console.log('Chat socket connected:', chatSocket?.id);
      // Rejoin active chat if any
      if (activeChatRef.current) {
        chatSocket?.emit('joinChat', activeChatRef.current.chat.id);
      }
    });

    chatSocket.on('getOnlineUsers', (userIds: string[]) => {
      setOnlineUsers(userIds);
    });

    chatSocket.on('newMessage', (msg: Message) => {
      addMessage(msg);
      updateChatLatest(msg.chatId, msg.text || 'file', msg.sender);
    });

    chatSocket.on('messageSeen', ({ messageId }: { chatId: string; seenBy: string; messageId: string[] }) => {
      updateMessageSeen(messageId);
    });

    chatSocket.on('userTyping', ({ chatId }: { chatId: string; userId: string }) => {
      setTyping(chatId, true);
    });

    chatSocket.on('userStoppedTyping', ({ chatId }: { chatId: string; userId: string }) => {
      setTyping(chatId, false);
    });

    chatSocket.on('disconnect', () => {
      console.log('Chat socket disconnected');
    });

    return () => {
      chatSocket?.disconnect();
      chatSocket = null;
    };
  }, [user?._id]);

  return chatSocket;
};

export const joinChatRoom = (chatId: string) => {
  chatSocket?.emit('joinChat', chatId);
};

export const leaveChatRoom = (chatId: string) => {
  chatSocket?.emit('leaveChat', chatId);
};

export const emitTyping = (chatId: string, userId: string) => {
  chatSocket?.emit('typing', { chatId, userId });
};

export const emitStopTyping = (chatId: string, userId: string) => {
  chatSocket?.emit('stopTyping', { chatId, userId });
};
