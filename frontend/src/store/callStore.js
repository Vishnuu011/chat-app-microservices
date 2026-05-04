import { create } from 'zustand'

export const useCallStore = create((set) => ({
  // active call state
  activeCall:      null,   // { callId, callerId, receiverId, chatId, callType, status }
  incomingCall:    null,   // { callId, callerId, chatId, callType }
  peerConnection:  null,
  localStream:     null,
  remoteStream:    null,
  callDuration:    0,
  isMuted:         false,
  isCameraOff:     false,

  // history
  callHistory:     [],

  setActiveCall:    (call)   => set({ activeCall: call }),
  setIncomingCall:  (call)   => set({ incomingCall: call }),
  clearIncoming:    ()       => set({ incomingCall: null }),
  setPeerConn:      (pc)     => set({ peerConnection: pc }),
  setLocalStream:   (s)      => set({ localStream: s }),
  setRemoteStream:  (s)      => set({ remoteStream: s }),
  setCallDuration:  (d)      => set({ callDuration: d }),
  toggleMute:       ()       => set(s => ({ isMuted: !s.isMuted })),
  toggleCamera:     ()       => set(s => ({ isCameraOff: !s.isCameraOff })),
  setCallHistory:   (h)      => set({ callHistory: h }),

  endActiveCall: () => set({
    activeCall: null, peerConnection: null,
    localStream: null, remoteStream: null,
    callDuration: 0, isMuted: false, isCameraOff: false,
  }),
}))
