import React, { useEffect, useState } from 'react';
import { useCallStore, useAuthStore } from '../../store';
import { getCallHistory, getAUser } from '../../api';
import { CallHistoryItem, User } from '../../types';
import { format } from 'date-fns';
import { Avatar } from '../common/Avatar';

interface CallHistoryPanelProps {
  onClose: () => void;
}

interface EnrichedCall extends CallHistoryItem {
  otherUserInfo?: User;
}

export const CallHistoryPanel: React.FC<CallHistoryPanelProps> = ({ onClose }) => {
  const { callHistory, setCallHistory } = useCallStore();
  const { user } = useAuthStore();
  const [enriched, setEnriched] = useState<EnrichedCall[]>([]);
  const [loading, setLoading] = useState(true);
  const myId = user?._id || user?.id || '';

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getCallHistory();
      const calls: CallHistoryItem[] = res.data.calls || [];
      setCallHistory(calls);
      // Enrich with user info
      const enrichedCalls = await Promise.all(
        calls.map(async (call) => {
          const otherId = call.callerId === myId ? call.receiverId : call.callerId;
          try {
            const uRes = await getAUser(otherId);
            return { ...call, otherUserInfo: uRes.data };
          } catch {
            return { ...call, otherUserInfo: { _id: otherId, name: 'Unknown', email: '' } };
          }
        })
      );
      setEnriched(enrichedCalls);
    } catch {} finally {
      setLoading(false);
    }
  };

  const statusIcon = (status: CallHistoryItem['status'], isCaller: boolean) => {
    if (status === 'missed') return { icon: '↙', color: '#ef4444', label: 'Missed' };
    if (status === 'rejected') return { icon: '✕', color: '#ef4444', label: 'Declined' };
    if (status === 'ended') return isCaller
      ? { icon: '↗', color: 'var(--accent)', label: 'Outgoing' }
      : { icon: '↙', color: '#3b82f6', label: 'Incoming' };
    return { icon: '⟳', color: 'var(--text-muted)', label: status };
  };

  const formatDuration = (secs?: number) => {
    if (!secs) return '';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={styles.title}>Recent Calls</span>
      </div>

      <div style={styles.list}>
        {loading ? (
          <div style={styles.center}><div style={styles.spinner} /></div>
        ) : enriched.length === 0 ? (
          <div style={styles.center}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No call history</p>
          </div>
        ) : (
          enriched.map((call) => {
            const isCaller = call.callerId === myId;
            const { icon, color, label } = statusIcon(call.status, isCaller);
            return (
              <div key={call.callId} style={styles.callItem}>
                <Avatar name={call.otherUserInfo?.name || 'U'} size={44} />
                <div style={styles.callInfo}>
                  <div style={styles.callTop}>
                    <span style={styles.callName}>{call.otherUserInfo?.name || 'Unknown'}</span>
                    <span style={{ ...styles.callStatus, color }}>
                      {icon} {label}
                    </span>
                  </div>
                  <div style={styles.callBottom}>
                    <span style={styles.callType}>
                      {call.callType === 'video' ? '📹' : '📞'} {call.callType}
                    </span>
                    {call.duration ? <span style={styles.duration}>{formatDuration(call.duration)}</span> : null}
                    <span style={styles.callTime}>
                      {format(new Date(call.createdAt), 'MMM d, HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: { flex: 1, display: 'flex', flexDirection: 'column', background: '#0b141a', animation: 'slideIn 0.2s' },
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex' },
  title: { fontWeight: 700, fontSize: 17 },
  list: { flex: 1, overflowY: 'auto' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 },
  spinner: { width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  callItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'default' },
  callInfo: { flex: 1 },
  callTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  callName: { fontWeight: 600, fontSize: 14 },
  callStatus: { fontSize: 12, fontWeight: 600 },
  callBottom: { display: 'flex', alignItems: 'center', gap: 8 },
  callType: { fontSize: 12, color: 'var(--text-secondary)' },
  duration: { fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 8 },
  callTime: { fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' },
};
