import React, { useState, useEffect } from 'react';
import { useAuthStore, useChatStore } from '../../store';
import { getAllChats, getAllUsers, createChat, getMessages } from '../../api';
import { Avatar } from '../common/Avatar';
import { ChatItem, User } from '../../types';
import { format } from 'date-fns';
import { joinChatRoom, leaveChatRoom } from '../../hooks/useChatSocket';
import toast from 'react-hot-toast';

interface SidebarProps {
  onCallHistoryClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCallHistoryClick }) => {
  const { user, clearAuth } = useAuthStore();
  const { chats, setChats, setActiveChat, activeChat, onlineUsers, setMessages, setUnseenZero } = useChatStore();
  const [search, setSearch] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    setLoadingChats(true);
    try {
      const res = await getAllChats();
      setChats(res.data.chats || []);
    } catch { } finally {
      setLoadingChats(false); }
  };

  const openNewChat = async () => {
    setShowNewChat(true);
    try {
      const res = await getAllUsers();
      const users = (res.data as User[]).filter((u) => u._id !== (user?._id || user?.id));
      setAllUsers(users);
    } catch { toast.error('Failed to load users'); }
  };

  const startChatWith = async (otherUser: User) => {
    try {
      const res = await createChat(otherUser._id);
      const chatId = res.data.chatId;
      setShowNewChat(false);
      await loadChats();
      // Open the chat
      const freshRes = await getAllChats();
      const freshChats: ChatItem[] = freshRes.data.chats || [];
      setChats(freshChats);
      const found = freshChats.find((c) => c.chat.id === chatId);
      if (found) handleSelectChat(found);
    } catch { toast.error('Failed to create chat'); }
  };

  const handleSelectChat = async (item: ChatItem) => {
    if (activeChat?.chat.id === item.chat.id) return;
    if (activeChat) leaveChatRoom(activeChat.chat.id);
    setActiveChat(item);
    joinChatRoom(item.chat.id);
    setUnseenZero(item.chat.id);
    try {
      const res = await getMessages(item.chat.id);
      setMessages(res.data.messages || []);
    } catch { }
  };

  const filteredChats = chats.filter((c) =>
    c.user.name.toLowerCase().includes(search.toLowerCase())
  );

  const myId = user?._id || user?.id || '';

  return (
    <div style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => setShowProfile(!showProfile)} style={styles.avatarBtn}>
          <Avatar name={user?.name || 'U'} size={38} />
        </button>
        <span style={styles.headerTitle}>Chats</span>
        <div style={styles.headerActions}>
          <button style={styles.iconBtn} title="Call History" onClick={onCallHistoryClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 010 1.19 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
            </svg>
          </button>
          <button style={styles.iconBtn} title="New Chat" onClick={openNewChat}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
          <button style={styles.iconBtn} title="Logout" onClick={clearAuth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Profile mini panel */}
      {showProfile && (
        <div style={styles.profilePanel}>
          <Avatar name={user?.name || 'U'} size={52} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{user?.email}</div>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={styles.searchBox}>
        <svg style={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          style={styles.searchInput}
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Chat List */}
      <div style={styles.chatList}>
        {loadingChats ? (
          <div style={styles.emptyState}>
            <div style={styles.spinner} />
          </div>
        ) : filteredChats.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No chats yet</p>
            <button style={styles.startBtn} onClick={openNewChat}>Start a conversation</button>
          </div>
        ) : (
          filteredChats.map((item) => {
            const isActive = activeChat?.chat.id === item.chat.id;
            const isOnline = onlineUsers.includes(item.user._id || item.user.id || '');
            const latest = item.chat.latestMessage;
            const isMine = latest?.sender === myId;
            return (
              <div
                key={item.chat.id}
                style={{ ...styles.chatItem, background: isActive ? 'var(--bg-hover)' : 'transparent' }}
                onClick={() => handleSelectChat(item)}
              >
                <Avatar name={item.user.name} size={48} online={isOnline} />
                <div style={styles.chatInfo}>
                  <div style={styles.chatTop}>
                    <span style={styles.chatName}>{item.user.name}</span>
                    <span style={styles.chatTime}>
                      {item.chat.updatedAt ? format(new Date(item.chat.updatedAt), 'HH:mm') : ''}
                    </span>
                  </div>
                  <div style={styles.chatBottom}>
                    <span style={styles.chatPreview}>
                      {isMine && <span style={{ color: 'var(--accent)' }}>You: </span>}
                      {latest?.text || 'Start chatting'}
                    </span>
                    {item.chat.unseencount > 0 && (
                      <span style={styles.badge}>{item.chat.unseencount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div style={styles.modal} onClick={() => setShowNewChat(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={{ fontWeight: 600 }}>New Chat</span>
              <button style={styles.iconBtn} onClick={() => setShowNewChat(false)}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 360 }}>
              {allUsers.length === 0 ? (
                <div style={styles.emptyState}><p style={{ color: 'var(--text-muted)' }}>No users found</p></div>
              ) : (
                allUsers.map((u) => (
                  <div key={u._id} style={styles.userItem} onClick={() => startChatWith(u)}>
                    <Avatar name={u.name} size={40} online={onlineUsers.includes(u._id)} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: { width: '360px', minWidth: '360px', background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', height: '100vh' },
  header: { display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12, background: 'var(--bg-header)' },
  headerTitle: { flex: 1, fontWeight: 700, fontSize: 18 },
  headerActions: { display: 'flex', gap: 4 },
  avatarBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s, color 0.2s' },
  profilePanel: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', animation: 'fadeIn 0.2s' },
  searchBox: { position: 'relative' as const, margin: '8px 12px', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute' as const, left: 12, color: 'var(--text-muted)' },
  searchInput: { width: '100%', padding: '9px 12px 9px 36px', background: 'var(--bg-input)', border: 'none', borderRadius: 20, color: 'var(--text-primary)', fontSize: 13, outline: 'none' },
  chatList: { flex: 1, overflowY: 'auto' as const },
  emptyState: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, color: 'var(--text-muted)' },
  spinner: { width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  startBtn: { background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 20, padding: '8px 20px', cursor: 'pointer', fontSize: 13 },
  chatItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', transition: 'background 0.15s', borderBottom: '1px solid rgba(255,255,255,0.03)' },
  chatInfo: { flex: 1, minWidth: 0 },
  chatTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  chatName: { fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  chatTime: { fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 },
  chatBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  chatPreview: { fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 },
  badge: { background: 'var(--accent)', color: 'white', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' as const, flexShrink: 0 },
  modal: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalContent: { background: 'var(--bg-panel)', borderRadius: 12, width: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' },
  userItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', transition: 'background 0.15s' },
};
