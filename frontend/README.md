# CipherChat — React Frontend

WhatsApp-style E2EE chat & video/voice call app built on your 4 FastAPI microservices.

## Architecture

```
User Service  :8000  → Auth (OTP), user CRUD, public key storage
Chat Service  :8002  → Chat rooms, messages, file upload, Socket.IO
Call Service  :8003  → Call signaling (WebRTC), call history, Socket.IO
Mail Service  :8001  → OTP email delivery via RabbitMQ (no direct frontend contact)
```

## Quick Start

```bash
npm install
cp .env.local .env          # edit service URLs if needed
npm run dev                 # opens on http://localhost:3000
```

## Encryption Design

### Message Encryption (X25519 + AES-256-GCM)
1. On first login, generate an **X25519 key pair** client-side (TweetNaCl)
2. Private key is encrypted with PBKDF2+AES-GCM (password = userId) → stored in **IndexedDB only**
3. Public key is uploaded to User Service
4. When sending a message:
   - Fetch recipient's public key from server
   - Generate ephemeral X25519 key pair
   - Derive shared secret → HKDF → AES-256-GCM key
   - Encrypt plaintext → send `{ __e2ee: true, ciphertext, iv, ephemeralPubKey }` as JSON string
5. Server stores the opaque encrypted blob — **cannot read it**
6. Recipient decrypts with their private key

### Call Encryption
- WebRTC uses **DTLS-SRTP** (built-in mandatory encryption for media)
- Signaling (offer/answer/ICE) goes via Socket.IO through Call Service

## Backend Notes

### Public Key Endpoints (add to User Service)
The frontend expects these two endpoints (not in the original zip):
```
POST /api/v1/public-key     { publicKey: string }   → store current user's public key
GET  /api/v1/public-key/:id                          → get any user's public key
```

Add these to `userController.py` and `userRouter.py`:
```python
# In User model, add: public_key: Optional[str] = None

async def uploadPublicKey(request, user=Depends(isAuth), db=Depends(get_db)):
    await db["users"].update_one({"_id": ObjectId(user["_id"])}, {"$set": {"public_key": request.publicKey}})
    return {"ok": True}

async def getPublicKey(id: str, db=Depends(get_db)):
    user = await db["users"].find_one({"_id": ObjectId(id)})
    return {"publicKey": user.get("public_key")}
```

## Socket Events Reference

### Chat Socket (port 8002)
| Event (emit)    | Payload                        |
|-----------------|-------------------------------|
| `joinChat`      | `chatId`                       |
| `leaveChat`     | `chatId`                       |
| `typing`        | `{ chatId, userId }`           |
| `stopTyping`    | `{ chatId, userId }`           |

| Event (listen)        | Payload                                  |
|-----------------------|------------------------------------------|
| `newMessage`          | MessageSchema                            |
| `messageSeen`         | `{ chatId, seenBy, messageId[] }`        |
| `userTyping`          | `{ chatId, userId }`                     |
| `userStoppedTyping`   | `{ chatId, userId }`                     |
| `getOnlineUsers`      | `string[]` (user IDs)                    |

### Call Socket (port 8003)
| Event (emit)    | Payload                                      |
|-----------------|---------------------------------------------|
| `callUser`      | `{ receiverId, offer, callerId }`            |
| `answerCall`    | `{ callerId, answer }`                       |
| `iceCandidate`  | `{ targetUserId, candidate }`                |
| `rejectCall`    | `{ callerId }`                               |
| `endCall`       | `{ targetUserId }`                           |

| Event (listen)  | Payload                                      |
|-----------------|---------------------------------------------|
| `incomingCall`  | `{ callId, callerId, chatId, callType }`     |
| `callOffer`     | `{ offer, callerId }`                        |
| `callAnswer`    | `{ answer }`                                 |
| `iceCandidate`  | `{ candidate }`                              |
| `callRejected`  | `{}`                                         |
| `callEnded`     | `{ callId?, duration? }`                     |

## Project Structure

```
src/
├── components/
│   ├── Auth/         LoginPage (OTP + key gen)
│   ├── Chat/         ChatList, ChatWindow, MessageBubble, MessageInput, ChatsPage
│   ├── Call/         CallInterface, CallHistory, IncomingCallNotification
│   ├── Contacts/     UserDirectory
│   └── Common/       Sidebar, MainLayout, PrivateRoute, ProfilePage
├── services/
│   ├── api/          userService, chatService, callService, apiClient
│   ├── encryption/   encryption.js (X25519 + AES-GCM + IndexedDB key storage)
│   └── socket/       socketManager.js
├── store/            authStore, chatStore, callStore (Zustand)
├── hooks/            useSocket, useWebRTC
└── App.jsx
```
