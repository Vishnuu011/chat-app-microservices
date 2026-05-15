import React, { useEffect, useState } from 'react';
import { useCallStore, useAuthStore } from '../../store';
import { getAUser } from '../../api';
import { emitAcceptCall, emitRejectCall } from '../../hooks/useCallSocket';
import { Avatar } from '../common/Avatar';
import { User } from '../../types';

export const IncomingCallOverlay: React.FC = () => {
  const { incomingCall, setIncomingCall, setActiveCall } = useCallStore();
  const [callerInfo, setCallerInfo] = useState<User | null>(null);

  useEffect(() => {
    if (!incomingCall) return;
    getAUser(incomingCall.callerId)
      .then((res) => setCallerInfo(res.data))
      .catch(() => setCallerInfo({ _id: incomingCall.callerId, name: 'Unknown', email: '' }));
  }, [incomingCall?.callerId]);

  if (!incomingCall) return null;

  const handleAccept = () => {
    emitAcceptCall(incomingCall.callerId, incomingCall.callId);
    setActiveCall({
      callId: incomingCall.callId,
      meetingId: incomingCall.meetingId,
      token: incomingCall.token,
      callerId: incomingCall.callerId,
      receiverId: incomingCall.receiverId,
      callType: incomingCall.callType,
      callerName: callerInfo?.name || 'Unknown',
    });
    setIncomingCall(null);
  };

  const handleReject = () => {
    emitRejectCall(incomingCall.callerId, incomingCall.callId);
    setIncomingCall(null);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.pulse}>
          <Avatar name={callerInfo?.name || '?'} size={72} />
        </div>
        <div style={styles.callTypeTag}>
          {incomingCall.callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
        </div>
        <h2 style={styles.name}>{callerInfo?.name || 'Unknown'}</h2>
        <p style={styles.subtitle}>Incoming {incomingCall.callType} call...</p>
        <div style={styles.actions}>
          <button style={styles.rejectBtn} onClick={handleReject}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M23 18.97c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.78-1.67-2.08-.18-.3 0-.46.13-.6.12-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.52-.07-.15-.68-1.63-.93-2.23-.24-.59-.49-.5-.68-.51l-.58-.01c-.2 0-.52.07-.79.38-.27.3-1.03 1-1.03 2.45s1.06 2.84 1.2 3.04c.15.2 2.08 3.17 5.04 4.45.7.3 1.25.48 1.68.62.7.22 1.34.19 1.85.12.56-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.19-.57-.34z" transform="rotate(135 12 12)"/>
            </svg>
          </button>
          <button style={styles.acceptBtn} onClick={handleAccept}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 010 1.19 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
            </svg>
          </button>
        </div>
        <div style={styles.labels}>
          <span>Decline</span>
          <span>Accept</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' },
  card: { background: 'var(--bg-panel)', borderRadius: 20, padding: '40px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', animation: 'fadeIn 0.3s ease' },
  pulse: { animation: 'ringPulse 1.5s infinite' },
  callTypeTag: { background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600 },
  name: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' },
  subtitle: { color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 },
  actions: { display: 'flex', gap: 32 },
  rejectBtn: { width: 64, height: 64, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(239,68,68,0.4)', transition: 'transform 0.15s' },
  acceptBtn: { width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,168,132,0.4)', transition: 'transform 0.15s' },
  labels: { display: 'flex', gap: 64, color: 'var(--text-secondary)', fontSize: 12 },
};
