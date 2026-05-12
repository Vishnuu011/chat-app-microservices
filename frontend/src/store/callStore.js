import { create } from 'zustand'

export const useCallStore = create((set, get) => ({
  activeCall:     null,
  incomingCall:   null,
  peerConnection: null,
  localStream:    null,
  remoteStream:   null,
  callDuration:   0,
  isMuted:        false,
  isCameraOff:    false,
  callHistory:    [],

  setActiveCall:   (call) => set({ activeCall: call }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  clearIncoming:   ()     => set({ incomingCall: null }),
  setPeerConn:     (pc)   => set({ peerConnection: pc }),
  setLocalStream:  (s)    => set({ localStream: s }),
  setRemoteStream: (s)    => set({ remoteStream: s }),
  // ✅ Fixed: unwrap function updater so d => d + 1 works correctly
  setCallDuration: (d)    => set({ callDuration: typeof d === 'function' ? d(get().callDuration) : d }),
  toggleMute:      ()     => set(s => ({ isMuted: !s.isMuted })),
  toggleCamera:    ()     => set(s => ({ isCameraOff: !s.isCameraOff })),
  setCallHistory:  (h)    => set({ callHistory: h }),

  endActiveCall: () => set({
    activeCall: null, peerConnection: null,
    localStream: null, remoteStream: null,
    callDuration: 0, isMuted: false, isCameraOff: false,
  }),
}))