import { useRef, useCallback } from 'react'
import { useCallStore } from '../store/callStore.js'
import { getCallSocket } from '../services/socket/socketManager.js'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
}

export function useWebRTC() {
  const { setPeerConn, setLocalStream, setRemoteStream, localStream } = useCallStore()
  const pcRef = useRef(null)

  const createPeerConnection = useCallback((targetUserId) => {
    const callSock = getCallSocket()
    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        callSock?.emit('iceCandidate', {
          targetUserId,
          candidate: e.candidate,
        })
      }
    }

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0])
    }

    pcRef.current = pc
    setPeerConn(pc)
    return pc
  }, [])

  const startMedia = useCallback(async (video = false) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video,
    })
    setLocalStream(stream)
    return stream
  }, [])

  const addStreamToPeer = useCallback((stream, pc) => {
    stream.getTracks().forEach(track => pc.addTrack(track, stream))
  }, [])

  const initiateCall = useCallback(async (targetUserId, callType) => {
    const callSock = getCallSocket()
    const pc = createPeerConnection(targetUserId)
    const stream = await startMedia(callType === 'video')
    addStreamToPeer(stream, pc)

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    callSock?.emit('callUser', {
      receiverId: targetUserId,
      offer,
      callerId: useCallStore.getState().activeCall?.callerId,
    })

    return { pc, stream }
  }, [createPeerConnection, startMedia, addStreamToPeer])

  const stopMedia = useCallback(() => {
    const stream = useCallStore.getState().localStream
    stream?.getTracks().forEach(t => t.stop())
    pcRef.current?.close()
    pcRef.current = null
  }, [])

  return { createPeerConnection, startMedia, addStreamToPeer, initiateCall, stopMedia }
}
