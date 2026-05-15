import axios from 'axios';

const getToken = () => localStorage.getItem('token');

const createInstance = (baseURL: string) => {
  const instance = axios.create({ baseURL });
  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return instance;
};

export const userApi = createInstance(import.meta.env.VITE_USER_SERVICE || 'http://localhost:8000');
export const chatApi = createInstance(import.meta.env.VITE_CHAT_SERVICE || 'http://localhost:8002');
export const callApi = createInstance(import.meta.env.VITE_CALL_SERVICE || 'http://localhost:8003');

// Auth
export const login = (email: string) => userApi.post('/api/v1/login', { email });
export const verifyOtp = (email: string, otp: string) => userApi.post('/api/v1/verify', { email, otp });
export const getMe = () => userApi.get('/api/v1/me');
export const getAllUsers = () => userApi.get('/api/v1/user/all');
export const getAUser = (id: string) => userApi.get(`/api/v1/user/${id}`);
export const updateName = (name: string) => userApi.post('/api/v1/update/user', { name });

// Chat
export const createChat = (otherUserId: string) => chatApi.post('/api/v1/chat/new', { otherUserId });
export const getAllChats = () => chatApi.get('/api/v1/chat/all');
export const getMessages = (chatId: string) => chatApi.get(`/api/v1/messages/${chatId}`);
export const sendMessage = (chatId: string, text?: string, file?: File) => {
  const formData = new FormData();
  formData.append('chatId', chatId);
  if (text) formData.append('text', text);
  if (file) formData.append('File', file);
  return chatApi.post('/api/v1/message', formData);
};

// Calls
export const startCall = (receiverId: string, chatId: string, callType: 'audio' | 'video') =>
  callApi.post('/api/v1/start-call', { receiverId, chatId, callType });
export const endCall = (callId: string) => callApi.post(`/api/v1/end-call/${callId}`);
export const getCallHistory = () => callApi.get('/api/v1/history');
