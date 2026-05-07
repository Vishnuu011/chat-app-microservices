# Call Service

Voice and video calling service with WebRTC signaling.

## Features

- Initiate voice/video calls
- WebRTC offer/answer signaling
- ICE candidate exchange
- Call history tracking
- Call duration recording
- Call ended notifications

## Setup

```bash
pip install -r requirements.txt
export DATABASE_URL=mongodb://localhost:27017/chat_app
export JWT_SECRET=your_secret_key
python index.py
```

## Port

Runs on **8003**

## API Endpoints

- `GET /api/v1/history` - Get call history
- `POST /api/v1/end-call/{callId}` - End call 
- `POST /api/v1/start-call` - start call

## WebSocket Events

### Emit
- `callUser` - Initiate call to user
- `answerCall` - Answer incoming call
- `iceCandidate` - Send ICE candidate
- `rejectCall` - Reject incoming call
- `endCall` - Terminate call

### Listen
- `incomingCall` - Receive call from user
- `callOffer` - WebRTC offer received
- `callAnswer` - WebRTC answer received
- `iceCandidate` - ICE candidate from peer
- `callRejected` - Call was rejected
- `callEnded` - Call ended by peer

## Database Models

- **Call** - Caller, receiver, type (audio/video), startTime, endTime, duration

## Environment Variables

```
DATABASE_URL
JWT_SECRET
```

## Media Encryption

- WebRTC media uses **DTLS-SRTP** (built-in encryption)
- Signaling via encrypted Socket.IO channel
