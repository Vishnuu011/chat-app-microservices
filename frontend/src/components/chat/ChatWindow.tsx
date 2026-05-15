import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthStore, useChatStore, useCallStore } from '../../store';
import { sendMessage, startCall } from '../../api';
import { MessageBubble } from './MessageBubble';
import { Avatar } from '../common/Avatar';
import { emitTyping, emitStopTyping } from '../../hooks/useChatSocket';
import toast from 'react-hot-toast';

export const ChatWindow: React.FC = () => {
  const { user } = useAuthStore();
  const { activeChat, messages, onlineUsers, typingUsers, addMessage, updateChatLatest } = useChatStore();
  const { setActiveCall } = useCallStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const myId = user?._id || user?.id || '';
  const chatId = activeChat?.chat.id || '';
  const otherUser = activeChat?.user;
  const isOtherOnline = onlineUsers.includes(otherUser?._id || otherUser?.id || '');
  const isOtherTyping = typingUsers[chatId] || false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherTyping]);

  const handleTyping = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping(chatId, myId);
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emitStopTyping(chatId, myId);
    }, 1500);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !file) || !chatId || sending) return;
    setSending(true);
    if (isTypingRef.current) {
      emitStopTyping(chatId, myId);
      isTypingRef.current = false;
    }
    try {
      const res = await sendMessage(chatId, text.trim() || undefined, file || undefined);
      const msg = res.data.message;
      updateChatLatest(chatId, msg.text || 'file', myId);
      setText('');
      setFile(null);
      setFilePreview(null);
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  };

  const handleStartCall = async (callType: 'audio' | 'video') => {
    if (!otherUser || !chatId) return;
    try {
      const res = await startCall(otherUser._id || otherUser.id || '', chatId, callType);
      const data = res.data;
      setActiveCall({
        callId: data.callId,
        meetingId: data.meetingId,
        token: data.token,
        callerId: myId,
        receiverId: data.receiverId,
        callType,
        callerName: otherUser.name,
      });
    } catch {
      toast.error('Failed to start call');
    }
  };

  if (!activeChat) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyContent}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <h2 style={styles.emptyTitle}>ChatApp</h2>
          <p style={styles.emptySubtitle}>Select a conversation or start a new one</p>
        </div>
      </div>
    );
  }

  const dateGroups: { date: string; messages: typeof messages }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const d = new Date(msg.createdAt).toLocaleDateString();
    if (d !== currentDate) {
      currentDate = d;
      dateGroups.push({ date: d, messages: [] });
    }
    dateGroups[dateGroups.length - 1].messages.push(msg);
  }

  return (
    <div style={styles.window}>
      {/* Chat Header */}
      <div style={styles.header}>
        <Avatar name={otherUser?.name || 'U'} size={40} online={isOtherOnline} />
        <div style={styles.headerInfo}>
          <span style={styles.headerName}>{otherUser?.name}</span>
          <span style={styles.headerStatus}>
            {isOtherTyping ? (
              <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>typing...</span>
            ) : isOtherOnline ? (
              <span style={{ color: 'var(--accent)' }}>online</span>
            ) : 'offline'}
          </span>
        </div>
        <div style={styles.callBtns}>
          <button style={styles.callBtn} title="Voice Call" onClick={() => handleStartCall('audio')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 010 1.19 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
            </svg>
          </button>
          <button style={styles.callBtn} title="Video Call" onClick={() => handleStartCall('video')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {dateGroups.map((group) => (
          <div key={group.date}>
            <div style={styles.dateDivider}>
              <span style={styles.dateLabel}>
                {new Date(group.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            {group.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isOwn={msg.sender === myId} />
            ))}
          </div>
        ))}

        {isOtherTyping && (
          <div style={styles.typingIndicator}>
            <div style={styles.typingDot} />
            <div style={{ ...styles.typingDot, animationDelay: '0.15s' }} />
            <div style={{ ...styles.typingDot, animationDelay: '0.3s' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File preview */}
      {file && (
        <div style={styles.filePreview}>
          {filePreview ? (
            <img src={filePreview} alt="preview" style={{ height: 60, borderRadius: 6 }} />
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>📎 {file.name}</span>
          )}
          <button onClick={() => { setFile(null); setFilePreview(null); }} style={styles.removeFileBtn}>✕</button>
        </div>
      )}

      {/* Input */}
      <form style={styles.inputArea} onSubmit={handleSend}>
        <button type="button" style={styles.attachBtn} onClick={() => fileInputRef.current?.click()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} accept="image/*,video/*,.pdf,.doc,.docx" />
        <textarea
          style={styles.textInput}
          placeholder="Type a message"
          value={text}
          onChange={(e) => { setText(e.target.value); handleTyping(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }}}
          rows={1}
        />
        <button type="submit" style={{ ...styles.sendBtn, opacity: (text.trim() || file) && !sending ? 1 : 0.5 }} disabled={!text.trim() && !file || sending}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  window: { flex: 1, display: 'flex', flexDirection: 'column', background: '#0b141a', position: 'relative', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,168,132,0.03) 0%, transparent 70%)' },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b141a' },
  emptyContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' },
  emptySubtitle: { color: 'var(--text-secondary)', fontSize: 14 },
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--bg-header)', borderBottom: '1px solid var(--border)', zIndex: 1 },
  headerInfo: { flex: 1 },
  headerName: { display: 'block', fontWeight: 600, fontSize: 15 },
  headerStatus: { display: 'block', fontSize: 12, color: 'var(--text-secondary)' },
  callBtns: { display: 'flex', gap: 4 },
  callBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  messages: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2 },
  dateDivider: { display: 'flex', justifyContent: 'center', margin: '8px 0' },
  dateLabel: { background: 'rgba(17,27,33,0.9)', color: 'var(--text-secondary)', fontSize: 11, padding: '4px 10px', borderRadius: 8 },
  typingIndicator: { display: 'flex', gap: 4, padding: '8px 14px', background: 'var(--bg-message-in)', borderRadius: '8px 8px 8px 2px', width: 58, alignSelf: 'flex-start', marginTop: 2 },
  typingDot: { width: 8, height: 8, background: 'var(--text-secondary)', borderRadius: '50%', animation: 'waveTyping 1.2s infinite' },
  filePreview: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--bg-panel)', borderTop: '1px solid var(--border)' },
  removeFileBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16 },
  inputArea: { display: 'flex', alignItems: 'flex-end', gap: 8, padding: '8px 12px', background: 'var(--bg-panel)', borderTop: '1px solid var(--border)' },
  attachBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 8, flexShrink: 0 },
  textInput: { flex: 1, background: 'var(--bg-input)', border: 'none', borderRadius: 20, padding: '10px 16px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'none', maxHeight: 100, lineHeight: 1.4 },
  sendBtn: { width: 42, height: 42, background: 'var(--accent)', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'opacity 0.2s' },
};
