import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore, useCallStore } from '../store';
import { IncomingCallData } from '../types';

let callSocket: Socket | null = null;

export const getCallSocket = () => callSocket;

export const useCallSocket = () => {
  const { user } = useAuthStore();
  const { setIncomingCall, setActiveCall, incomingCall, activeCall } = useCallStore();

  useEffect(() => {
    if (!user) return;

    const CALL_SOCKET_URL = import.meta.env.VITE_CALL_SOCKET || 'http://localhost:8003';

    callSocket = io(CALL_SOCKET_URL, {
      query: { userId: user._id || user.id },
      transports: ['websocket'],
    });

    callSocket.on('connect', () => {
      console.log('Call socket connected:', callSocket?.id);
    });

    callSocket.on('incomingCall', (data: IncomingCallData) => {
      console.log('Incoming call:', data);
      setIncomingCall(data);
    });

    callSocket.on('callAccepted', ({ callId }: { callId: string }) => {
      console.log('Call accepted:', callId);
      // The active call is already set on caller side — just log
    });

    callSocket.on('callRejected', ({ callId }: { callId: string }) => {
      console.log('Call rejected:', callId);
      setActiveCall(null);
      setIncomingCall(null);
    });

    callSocket.on('callEnded', ({ callId }: { callId: string }) => {
      console.log('Call ended:', callId);
      setActiveCall(null);
      setIncomingCall(null);
    });

    callSocket.on('disconnect', () => {
      console.log('Call socket disconnected');
    });

    return () => {
      callSocket?.disconnect();
      callSocket = null;
    };
  }, [user?._id]);
};

export const emitAcceptCall = (callerId: string, callId: string) => {
  callSocket?.emit('acceptCall', { callerId, callId });
};

export const emitRejectCall = (callerId: string, callId: string) => {
  callSocket?.emit('rejectCall', { callerId, callId });
};

export const emitEndCall = (targetUserId: string, callId: string) => {
  callSocket?.emit('endCall', { targetUserId, callId });
};
