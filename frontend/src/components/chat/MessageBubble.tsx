import React from 'react';
import { Message } from '../../types';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const time = format(new Date(message.createdAt), 'HH:mm');

  const renderContent = () => {
    if (message.messageType === 'image' && message.file) {
      return (
        <div>
          <img
            src={message.file.url}
            alt="img"
            style={{ maxWidth: 220, maxHeight: 200, borderRadius: 8, display: 'block', cursor: 'pointer' }}
            onClick={() => window.open(message.file!.url, '_blank')}
          />
          {message.text && <p style={{ marginTop: 4, fontSize: 13 }}>{message.text}</p>}
        </div>
      );
    }
    if (message.messageType === 'video' && message.file) {
      return (
        <video controls style={{ maxWidth: 220, borderRadius: 8 }} src={message.file.url} />
      );
    }
    if (message.messageType === 'document' && message.file) {
      return (
        <a href={message.file.url} target="_blank" rel="noreferrer" style={styles.docLink}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span>{message.file.fileName || 'Document'}</span>
        </a>
      );
    }
    return <p style={{ fontSize: 13.5, lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{message.text}</p>;
  };

  return (
    <div style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
      <div style={{ ...styles.bubble, ...(isOwn ? styles.ownBubble : styles.otherBubble) }}>
        {renderContent()}
        <div style={styles.meta}>
          <span style={styles.time}>{time}</span>
          {isOwn && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={message.seen ? '#53bdeb' : '#8696a0'} strokeWidth="2.5">
              {message.seen ? (
                <>
                  <polyline points="18 6 9 17 4 12" />
                  <polyline points="23 6 14 17" />
                </>
              ) : (
                <polyline points="20 6 9 17 4 12" />
              )}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  bubble: {
    maxWidth: 320,
    padding: '7px 12px 6px',
    borderRadius: 8,
    position: 'relative',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },
  ownBubble: {
    background: 'var(--bg-message-out)',
    borderTopRightRadius: 2,
    color: 'var(--text-primary)',
  },
  otherBubble: {
    background: 'var(--bg-message-in)',
    borderTopLeftRadius: 2,
    color: 'var(--text-primary)',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 3,
  },
  time: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  docLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'var(--accent)',
    fontSize: 13,
    textDecoration: 'none',
  },
};
