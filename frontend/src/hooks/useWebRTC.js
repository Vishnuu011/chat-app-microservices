import { useRef, useCallback } from 'react'
import { useCallStore } from '../store/callStore.js'
import { useAuthStore } from '../store/authStore.js'
import { getCallSocket } from '../services/socket/socketManager.js'

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
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
      console.log("🎥 Remote stream received", e.streams)
      if (e.streams?.[0]) setRemoteStream(e.streams[0])
    }

    pcRef.current = pc
    setPeerConn(pc)
    return pc
  }, [setPeerConn, setRemoteStream])

  const startMedia = useCallback(async (video = false) => {
    const existing = useCallStore.getState().localStream
    if (existing) return existing

    // ✅ Fixed: respect the video flag — voice calls don't request camera
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video
    })

    console.log("🎤 Audio tracks:", stream.getAudioTracks())
    console.log("🎥 Video tracks:", stream.getVideoTracks())

    setLocalStream(stream)
    return stream
  }, [setLocalStream])

  const addStreamToPeer = useCallback((stream, pc) => {
    stream.getTracks().forEach(track => pc.addTrack(track, stream))
  }, [])

  const initiateCall = useCallback(async (targetUserId, callType, callId) => {
    const callSock = getCallSocket()
    const { user } = useAuthStore.getState()

    // ✅ Fixed: check both id and _id
    const callerId = user?.id || user?._id
    if (!callerId) {
      console.error("❌ callerId missing")
      return
    }

    const pc = createPeerConnection(targetUserId)
    const stream = await startMedia(callType === 'video')
    addStreamToPeer(stream, pc)

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    // ✅ Fixed: include callId so backend can track the call
    callSock?.emit('callUser', {
      receiverId: targetUserId,
      callerId,
      offer,
      callType,
      callId
    })

    return { pc, stream }
  }, [createPeerConnection, startMedia, addStreamToPeer])

  const stopMedia = useCallback(() => {
    const stream = useCallStore.getState().localStream
    stream?.getTracks().forEach(track => track.stop())

    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }

    setLocalStream(null)
    setRemoteStream(null)
  }, [setLocalStream, setRemoteStream])

  return {
    createPeerConnection,
    startMedia,
    addStreamToPeer,
    initiateCall,
    stopMedia
  }
}