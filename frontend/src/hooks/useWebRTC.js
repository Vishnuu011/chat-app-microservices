import { useRef, useCallback } from 'react'
import { useCallStore } from '../store/callStore.js'
import { useAuthStore } from '../store/authStore.js'
import { getCallSocket } from '../services/socket/socketManager.js'

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]
}

export function useWebRTC() {
  const { setPeerConn, setLocalStream, setRemoteStream } = useCallStore()
  const pcRef = useRef(null)

  // -----------------------------
  // CREATE PEER
  // -----------------------------
  const createPeerConnection = useCallback((targetUserId) => {
    const callSock = getCallSocket()
    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.onicecandidate = (event) => {
      if (!event.candidate) return

      callSock?.emit('iceCandidate', {
        targetUserId,
        candidate: event.candidate
      })
    }

    pc.ontrack = (e) => {
      console.log("🎥 Remote stream received")
      setRemoteStream(e.streams[0])
    }

    pcRef.current = pc
    setPeerConn(pc)

    return pc
  }, [])

  // -----------------------------
  // START MEDIA
  // -----------------------------
  const startMedia = useCallback(async (video = false) => {

    const existing = useCallStore.getState().localStream
    if (existing) return existing

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video
    })

    console.log("🎤 Audio tracks:", stream.getAudioTracks())
    console.log("🎥 Video tracks:", stream.getVideoTracks())

    setLocalStream(stream)

    return stream

  }, [])

  // -----------------------------
  // ADD STREAM
  // -----------------------------
  const addStreamToPeer = useCallback((stream, pc) => {
    stream.getTracks().forEach(track => pc.addTrack(track, stream))
  }, [])

  // -----------------------------
  // INITIATE CALL (CALLER)
  // -----------------------------
  const initiateCall = useCallback(async (targetUserId, callType) => {
    const callSock = getCallSocket()
    const { user } = useAuthStore.getState()

    if (!user?.id) {
      console.error("❌ callerId missing")
      return
    }

    console.log("📞 Calling:", targetUserId)

    const pc = createPeerConnection(targetUserId)

    const stream = await startMedia(callType === 'video')
    addStreamToPeer(stream, pc)

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    callSock?.emit('callUser', {
      receiverId: targetUserId,
      callerId: user.id,
      offer,
      callType
    })

    return { pc, stream }
  }, [createPeerConnection, startMedia, addStreamToPeer])

  // -----------------------------
  // STOP MEDIA
  // -----------------------------
  const stopMedia = useCallback(() => {
    const stream = useCallStore.getState().localStream

    stream?.getTracks().forEach(track => track.stop())

    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }

    setLocalStream(null)
    setRemoteStream(null)
  }, [])

  return {
    createPeerConnection,
    startMedia,
    addStreamToPeer,
    initiateCall,
    stopMedia
  }
}
