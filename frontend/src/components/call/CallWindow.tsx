import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
  VideoPlayer,
  AudioPlayer,
} from '@videosdk.live/react-sdk';
import { useCallStore, useAuthStore } from '../../store';
import { endCall } from '../../api';
import { emitEndCall } from '../../hooks/useCallSocket';
import { Avatar } from '../common/Avatar';

// ─────────────────────────────────────────────────────────────────────────────
// SDK facts confirmed from dist/index.modern.js:
//  1. participants Map INCLUDES local (line: participants.set(localParticipant.id, ...))
//  2. VideoPlayer <video> is always muted:true  — audio only via AudioPlayer
//  3. AudioPlayer <audio> muted={isLocal}       — safe to render for all
//  4. Streams only set when track.readyState === 'live'
//  5. consumeMicStreams() / consumeWebcamStreams() must be called on remote
//     participants to start receiving their streams
// ─────────────────────────────────────────────────────────────────────────────

// ── Remote participant tile ───────────────────────────────────────────────────
const RemoteParticipantTile: React.FC<{ participantId: string; callType: 'audio' | 'video' }> = ({
  participantId,
  callType,
}) => {
  const { webcamOn, micOn, displayName, consumeMicStreams, consumeWebcamStreams } = useParticipant(participantId);

  // Call consumeMicStreams / consumeWebcamStreams when component mounts
  // and whenever the stream keys become available — this tells the SDK
  // to start pulling media from this participant
  useEffect(() => {
    consumeMicStreams();
  }, [participantId]);

  useEffect(() => {
    if (callType === 'video') {
      consumeWebcamStreams();
    }
  }, [participantId, callType]);

  return (
    <div style={tileS.wrap}>
      {/* Video */}
      {callType === 'video' && webcamOn ? (
        <VideoPlayer
          participantId={participantId}
          type="video"
          videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
          containerStyle={{ width: '100%', height: '100%' }}
        />
      ) : (
        <div style={tileS.avatarBox}>
          <Avatar name={displayName || 'U'} size={80} />
          <span style={tileS.avatarName}>{displayName || 'Participant'}</span>
        </div>
      )}

      {/* AudioPlayer — SDK sets muted=false for remote, muted=true for local */}
      {/* Always render regardless of micOn so audio starts as soon as stream arrives */}
      <AudioPlayer participantId={participantId} type="audio" />

      {/* Name overlay */}
      <div style={tileS.nameTag}>
        {!micOn && <span style={{ marginRight: 4 }}>🔇</span>}
        {displayName || 'Participant'}
      </div>
    </div>
  );
};

// ── Local participant tile (muted — no echo) ──────────────────────────────────
const LocalParticipantTile: React.FC<{ participantId: string; callType: 'audio' | 'video'; small?: boolean }> = ({
  participantId,
  callType,
  small,
}) => {
  const { webcamOn, displayName } = useParticipant(participantId);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#1c2b33', overflow: 'hidden' }}>
      {callType === 'video' && webcamOn ? (
        <VideoPlayer
          participantId={participantId}
          type="video"
          videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
          containerStyle={{ width: '100%', height: '100%' }}
        />
      ) : (
        <div style={tileS.avatarBox}>
          <Avatar name={displayName || 'Me'} size={small ? 36 : 64} />
          {!small && <span style={tileS.avatarName}>{displayName || 'You'}</span>}
        </div>
      )}
      {/* NO AudioPlayer here — would cause echo */}
      <div style={tileS.nameTag}>
        {displayName || 'You'}
        <span style={tileS.youBadge}>You</span>
      </div>
    </div>
  );
};

// ── Controls ──────────────────────────────────────────────────────────────────
const Controls: React.FC<{ callType: 'audio' | 'video'; onEnd: () => void }> = ({ callType, onEnd }) => {
  const { localMicOn, localWebcamOn, toggleMic, toggleWebcam } = useMeeting();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={ctrlS.bar}>
      <span style={ctrlS.timer}>{fmt(elapsed)}</span>
      <div style={ctrlS.btns}>

        {/* Mic */}
        <button
          style={{ ...ctrlS.btn, background: localMicOn ? 'rgba(255,255,255,0.15)' : '#ef4444' }}
          onClick={() => toggleMic()}
          title={localMicOn ? 'Mute' : 'Unmute'}
        >
          {localMicOn ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
              <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8"/>
            </svg>
          )}
        </button>

        {/* Camera */}
        {callType === 'video' && (
          <button
            style={{ ...ctrlS.btn, background: localWebcamOn ? 'rgba(255,255,255,0.15)' : '#ef4444' }}
            onClick={() => toggleWebcam()}
            title={localWebcamOn ? 'Stop Camera' : 'Start Camera'}
          >
            {localWebcamOn ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34l1 1L23 7v10M1 1l22 22"/>
              </svg>
            )}
          </button>
        )}

        {/* End call */}
        <button
          style={{ ...ctrlS.btn, background: '#ef4444' }}
          onClick={onEnd}
          title="End Call"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.07 9.81 19.79 19.79 0 011 1.19 2 2 0 013 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7 7.91"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </button>

      </div>
    </div>
  );
};

// ── MeetingRoom ───────────────────────────────────────────────────────────────
const MeetingRoom: React.FC<{ callType: 'audio' | 'video'; onEnd: () => void }> = ({
  callType,
  onEnd,
}) => {
  const { participants, localParticipant, isMeetingJoined } = useMeeting({
    onMeetingLeft: onEnd,
    onError: (err: any) => console.error('[VideoSDK]', err),
  });

  // SDK puts local in participants map — exclude it
  const localId = localParticipant?.id;
  const remoteIds = Array.from(participants.keys()).filter(id => id !== localId);

  const isConnecting = !isMeetingJoined;
  const isWaiting = isMeetingJoined && remoteIds.length === 0;
  const hasRemote = remoteIds.length > 0;

  return (
    <div style={roomS.room}>
      <div style={roomS.stage}>

        {/* Connecting */}
        {isConnecting && (
          <div style={roomS.center}>
            <div style={roomS.spinner} />
            <p style={roomS.hint}>Connecting…</p>
          </div>
        )}

        {/* Waiting for other person */}
        {isWaiting && (
          <>
            <div style={roomS.center}>
              <div style={roomS.spinner} />
              <p style={roomS.hint}>Calling… waiting for them to join</p>
            </div>
            {/* Show local in small card while waiting */}
            {localId && callType === 'video' && (
              <div style={roomS.pipWaiting}>
                <LocalParticipantTile participantId={localId} callType={callType} small />
              </div>
            )}
            {localId && callType === 'audio' && (
              <div style={roomS.audioWaiting}>
                <LocalParticipantTile participantId={localId} callType={callType} />
              </div>
            )}
          </>
        )}

        {/* 1-to-1 call active */}
        {hasRemote && (
          <>
            {/* Remote fills full stage */}
            <div style={roomS.mainTile}>
              <RemoteParticipantTile
                key={remoteIds[0]}
                participantId={remoteIds[0]}
                callType={callType}
              />
            </div>

            {/* Local PiP bottom-right */}
            {localId && (
              <div style={roomS.pip}>
                <LocalParticipantTile participantId={localId} callType={callType} small />
              </div>
            )}
          </>
        )}

      </div>

      <Controls callType={callType} onEnd={onEnd} />
    </div>
  );
};

// ── Root export ───────────────────────────────────────────────────────────────
export const CallWindow: React.FC = () => {
  const { activeCall, setActiveCall } = useCallStore();
  const { user } = useAuthStore();
  const myId = user?._id || user?.id || '';

  const handleEnd = useCallback(async () => {
    if (!activeCall) return;
    try { await endCall(activeCall.callId); } catch {}
    const targetId = activeCall.callerId === myId ? activeCall.receiverId : activeCall.callerId;
    emitEndCall(targetId, activeCall.callId);
    setActiveCall(null);
  }, [activeCall, myId, setActiveCall]);

  if (!activeCall) return null;

  return (
    <div style={rootS.overlay}>
      <div style={rootS.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{activeCall.callType === 'video' ? '📹' : '📞'}</span>
          <div>
            <div style={rootS.name}>{activeCall.callerName || 'Call'}</div>
            <div style={rootS.sub}>{activeCall.callType === 'video' ? 'Video Call' : 'Voice Call'}</div>
          </div>
        </div>
      </div>

      {/* key=meetingId ensures a full remount for each new call — no stale state */}
      <MeetingProvider
        key={activeCall.meetingId}
        config={{
          meetingId: activeCall.meetingId,
          micEnabled: true,
          webcamEnabled: activeCall.callType === 'video',
          name: user?.name || 'Me',
          debugMode: false,
        }}
        token={activeCall.token}
        joinWithoutUserInteraction
      >
        <MeetingRoom callType={activeCall.callType} onEnd={handleEnd} />
      </MeetingProvider>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const rootS: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: '#0d1117',
    display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font)',
  },
  header: {
    flexShrink: 0, padding: '10px 18px',
    background: 'rgba(255,255,255,0.04)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center',
  },
  name: { fontWeight: 700, fontSize: 15, color: '#e9edef' },
  sub: { fontSize: 11, color: '#8696a0', marginTop: 1 },
};

const roomS: Record<string, React.CSSProperties> = {
  room: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 },
  stage: { flex: 1, position: 'relative', background: '#0d1117', overflow: 'hidden', minHeight: 0 },
  // Remote fills full stage
  mainTile: { position: 'absolute', inset: 0 },
  // Local PiP — fixed corner
  pip: {
    position: 'absolute', bottom: 12, right: 12,
    width: 150, height: 94,
    borderRadius: 10, overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.2)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.6)', zIndex: 10,
  },
  pipWaiting: {
    position: 'absolute', bottom: 12, right: 12,
    width: 150, height: 94,
    borderRadius: 10, overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.2)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.6)', zIndex: 10,
  },
  audioWaiting: {
    position: 'absolute', bottom: 90, left: '50%',
    transform: 'translateX(-50%)',
    width: 160, height: 160, borderRadius: 12, overflow: 'hidden',
  },
  center: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  spinner: {
    width: 36, height: 36,
    border: '3px solid rgba(255,255,255,0.08)',
    borderTopColor: '#00a884', borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  hint: { color: '#8696a0', fontSize: 13 },
};

const tileS: Record<string, React.CSSProperties> = {
  wrap: { width: '100%', height: '100%', position: 'relative', background: '#1c2b33', overflow: 'hidden' },
  avatarBox: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 12, background: '#1c2b33',
  },
  avatarName: { color: '#e9edef', fontSize: 16, fontWeight: 600 },
  nameTag: {
    position: 'absolute', bottom: 8, left: 8,
    background: 'rgba(0,0,0,0.7)', color: '#fff',
    padding: '3px 10px', borderRadius: 20,
    fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
    backdropFilter: 'blur(4px)',
  },
  youBadge: {
    marginLeft: 4, background: '#00a884',
    borderRadius: 10, padding: '1px 7px', fontSize: 10, color: 'white',
  },
};

const ctrlS: Record<string, React.CSSProperties> = {
  bar: {
    flexShrink: 0, height: 80, padding: '0 24px',
    background: 'rgba(255,255,255,0.04)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  timer: {
    position: 'absolute', left: 24,
    color: '#8696a0', fontSize: 14,
    fontVariantNumeric: 'tabular-nums',
  },
  btns: { display: 'flex', gap: 14, alignItems: 'center' },
  btn: {
    width: 52, height: 52, borderRadius: '50%',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.1s, background 0.2s', flexShrink: 0,
  },
};
