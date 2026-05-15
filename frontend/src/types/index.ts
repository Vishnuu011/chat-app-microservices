export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface LatestMessage {
  text: string;
  sender: string;
}

export interface ChatSchema {
  id: string;
  users: string[];
  createdAt?: string;
  updatedAt?: string;
  latestMessage?: LatestMessage | null;
  unseencount: number;
}

export interface ChatItem {
  user: User;
  chat: ChatSchema;
}

export interface FileSchema {
  url: string;
  publicId: string;
  fileName?: string;
  format?: string;
  size?: number;
}

export interface Message {
  id: string;
  chatId: string;
  sender: string;
  text?: string;
  file?: FileSchema;
  messageType: 'text' | 'image' | 'video' | 'document';
  seen: boolean;
  seenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CallType = 'audio' | 'video';
export type CallStatus = 'ringing' | 'accepted' | 'rejected' | 'missed' | 'ended';

export interface CallHistoryItem {
  callId: string;
  callerId: string;
  receiverId: string;
  chatId: string;
  callType: CallType;
  status: CallStatus;
  createdAt: string;
  duration?: number;
}

export interface IncomingCallData {
  callId: string;
  meetingId: string;
  token: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
}

export interface ActiveCallData {
  callId: string;
  meetingId: string;
  token: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
  callerName?: string;
}
