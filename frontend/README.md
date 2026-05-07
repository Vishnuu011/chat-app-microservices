# Frontend - React Chat App

Modern React/Vite frontend for secure real-time chat and calling with end-to-end encryption.

## Features

- 🔐 **E2E Encryption** - X25519 + AES-256-GCM
- 💬 **Real-time Chat** - WebSocket messaging
- 📞 **Voice/Video Calls** - WebRTC P2P
- 🔑 **OTP Login** - Secure authentication
- 👥 **User Directory** - Find & add contacts
- 📱 **Responsive** - Works on all devices

## Quick Start

```bash
npm install
cp .env.local .env
npm run dev  # http://localhost:5173
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Socket.IO** - Real-time messaging
- **WebRTC** - P2P calling
- **TweetNaCl.js** - Encryption

## Project Structure

```
src/
├── components/       # React components
│   ├── Auth/        # LoginPage
│   ├── Chat/        # ChatWindow, MessageInput
│   ├── Call/        # CallInterface
│   ├── Contacts/    # UserDirectory
│   └── Common/      # Layout, Sidebar
├── services/        # API, encryption, socket
├── hooks/           # useSocket, useWebRTC
├── store/           # Zustand stores
└── App.jsx
```

## Environment Variables

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=http://localhost:8002
VITE_CALL_WS_URL=http://localhost:8003
```

## Available Commands

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview build
```

## Encryption

- **Message Encryption:** X25519 + AES-256-GCM
- **Call Encryption:** DTLS-SRTP (WebRTC built-in)
- **Key Storage:** IndexedDB (encrypted with PBKDF2)

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

## Documentation

## Documentation

See [root README](../README.md) for full project documentation.

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

### Complete Directory Layout
```
src/
├── components/
│   ├── Auth/
│   │   └── LoginPage.jsx      # OTP login + X25519 key generation
│   ├── Chat/
│   │   ├── ChatList.jsx       # List of active conversations
│   │   ├── ChatsPage.jsx      # Main chat page layout
│   │   ├── ChatWindow.jsx     # Individual chat window with messages
│   │   ├── MessageBubble.jsx  # Message display component
│   │   └── MessageInput.jsx   # Message input with encryption
│   ├── Call/
│   │   ├── CallInterface.jsx  # Active call UI
│   │   ├── CallHistory.jsx    # Past calls list
│   │   └── IncomingCallNotification.jsx  # Incoming call alert
│   ├── Contacts/
│   │   └── UserDirectory.jsx  # Browse and search users
│   └── Common/
│       ├── Sidebar.jsx        # Navigation sidebar
│       ├── MainLayout.jsx     # Main layout wrapper
│       ├── PrivateRoute.jsx   # Protected route component
│       └── ProfilePage.jsx    # User profile display/edit
├── services/
│   ├── api/
│   │   ├── apiClient.js       # Axios HTTP client with interceptors
│   │   ├── authService.js     # Authentication API
│   │   ├── userService.js     # User management API
│   │   ├── chatService.js     # Chat API
│   │   └── callService.js     # Call API
│   ├── encryption/
│   │   └── encryption.js      # X25519 + AES-256-GCM + IndexedDB
│   └── socket/
│       └── socketManager.js   # Socket.IO connection management
├── store/
│   ├── authStore.js           # Authentication state (Zustand)
│   ├── chatStore.js           # Chat/messaging state
│   └── callStore.js           # Call state
├── hooks/
│   ├── useSocket.js           # WebSocket hook
│   └── useWebRTC.js           # WebRTC peer-to-peer hook
├── App.jsx                    # Main app component with routing
├── main.jsx                   # Application entry point
└── index.css                  # Global styles + Tailwind imports
```

## Component Details

### Auth Components
- **LoginPage.jsx** - Handles OTP-based authentication and generates X25519 keypair on first login

### Chat Components
- **ChatsPage.jsx** - Main page layout with sidebar and chat window
- **ChatList.jsx** - Lists all active conversations with last message preview
- **ChatWindow.jsx** - Displays messages and handles message history
- **MessageBubble.jsx** - Individual message display (encrypted content shown as bubbles)
- **MessageInput.jsx** - Encrypts and sends messages via Socket.IO

### Call Components
- **CallInterface.jsx** - Active call UI with video/audio controls
- **IncomingCallNotification.jsx** - Alert for incoming calls with accept/reject
- **CallHistory.jsx** - Lists previous calls with duration and timestamps

### Contacts Components
- **UserDirectory.jsx** - Searchable list of all users, initiate new chats

### Common Components
- **Sidebar.jsx** - Navigation menu with current user info
- **MainLayout.jsx** - Wrapper providing consistent layout
- **PrivateRoute.jsx** - Route guard for authenticated pages
- **ProfilePage.jsx** - View and edit user profile

## Services

### API Services (`src/services/api/`)
All services use the centralized `apiClient` with automatic JWT token injection and error handling.

**authService.js**
```javascript
sendOTP(email)           // Send OTP to email
verifyOTP(email, otp)    // Verify OTP and get token
```

**userService.js**
```javascript
getProfile()             // Get current user
getUserDirectory()       // Get all users
getPublicKey(userId)     // Get user's public key
uploadPublicKey(key)     // Upload X25519 public key
updateProfile(data)      // Update user info
```

**chatService.js**
```javascript
getChats()               // Get all conversations
getMessages(chatId)      // Get chat messages
createChat(userId)       // Start new chat with user
```

**callService.js**
```javascript
getCallHistory()         // Get past calls
saveCallRecord(data)     // Save call metadata
```

### Encryption Service (`src/services/encryption/`)
```javascript
generateKeyPair()        // Generate X25519 keypair
encryptMessage(plaintext, recipientPublicKey)  // Encrypt message
decryptMessage(encrypted, privateKey)          // Decrypt message
```

**Key Storage:**
- Private keys stored in **IndexedDB** (encrypted with PBKDF2 derived key)
- Public keys sent to backend
- Ephemeral keys generated per message for PFS (Perfect Forward Secrecy)

### Socket Manager (`src/services/socket/`)
Manages dual Socket.IO connections:
- Chat socket (port 8002) - messaging events
- Call socket (port 8003) - calling events

## State Management (Zustand)

### authStore.js
```javascript
// State
user                     // Current user object
token                    // JWT token
keyPair                  // X25519 keypair
isAuthenticated          // Auth status

// Actions
login(email, otp)        // OTP login
logout()                 // Clear auth
generateKeys()           // Generate X25519 keypair
setUser(userData)        // Update user info
```

### chatStore.js
```javascript
// State
conversations            // List of chats
currentChat              // Selected conversation
messages                 // Messages in current chat
typingUsers              // Users currently typing
onlineUsers              // Online user IDs

// Actions
fetchChats()             // Load conversations
selectChat(chatId)       // Switch to chat
sendMessage(content)     // Encrypt and send
markAsRead(messageId)    // Mark message read
setTyping(chatId, isTyping)  // Emit typing status
```

### callStore.js
```javascript
// State
ongoingCall              // Active call info
callHistory              // Past calls
incomingCall             // Pending incoming call

// Actions
initiateCall(userId)     // Start WebRTC call
answerCall()             // Accept incoming call
rejectCall()             // Decline call
endCall()                // Terminate call
addToHistory(callRecord) // Save call record
```

## Custom Hooks

### useSocket
```javascript
const { 
  connected,             // Connection status
  sendMessage,           // Send chat message
  onMessage,             // Listen for messages
  emit                   // Emit custom event
} = useSocket();
```

### useWebRTC
```javascript
const {
  localStream,           // Local media stream
  remoteStream,          // Peer's media stream
  initiateCall,          // Start call
  answerCall,            // Accept call
  endCall                // Terminate call
} = useWebRTC();
```

## Development

### Installation & Setup

```bash
# Clone repository
git clone <repo-url>
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.local .env
# Edit .env with your service URLs

# Start development server with hot reload
npm run dev
```

### Available Scripts

```bash
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build locally
npm run lint             # Run ESLint (if configured)
npm run type-check       # Check TypeScript (if configured)
```

### Development Workflow

1. **Creating a New Component**
   ```jsx
   import { create } from 'zustand';
   import { useSocket } from '@/hooks/useSocket';
   import { apiClient } from '@/services/api/apiClient';
   
   export function NewComponent() {
     const { connected } = useSocket();
     // Component logic
     return <div>Component</div>;
   }
   ```

2. **Using State Management**
   ```javascript
   import { useChatStore } from '@/store/chatStore';
   
   const { messages, sendMessage } = useChatStore();
   ```

3. **Making API Calls**
   ```javascript
   import { userService } from '@/services/api/userService';
   
   const profile = await userService.getProfile();
   ```

4. **Socket Emitting**
   ```javascript
   const { emit } = useSocket();
   emit('joinChat', chatId);
   ```

## Styling

### Tailwind CSS
- Configured in `tailwind.config.js`
- Global styles in `src/index.css`
- Utility-first approach for all component styling
- Customizable theme (colors, spacing, typography)

### Best Practices
- Use Tailwind utilities instead of custom CSS
- Responsive design with Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Component-level styling in component files

## Performance Optimization

- **Code Splitting** - Vite automatically chunks code
- **Lazy Loading** - React.lazy() for route-based code splitting
- **Image Optimization** - Use appropriate image formats
- **WebSocket** - Efficient real-time updates with Socket.IO
- **Encryption** - Offload to Web Workers if needed for large files
- **Caching** - API responses cached where appropriate

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- All modern evergreen browsers with WebRTC support

## Security Considerations

✅ **What's Implemented:**
- E2EE encryption on all messages (X25519 + AES-256-GCM)
- DTLS-SRTP encryption for WebRTC media
- Secure key storage in IndexedDB with PBKDF2 encryption
- JWT tokens for API authentication
- OTP-based login (no password stored)

⚠️ **Additional Recommendations:**
- Use HTTPS/WSS in production (not HTTP/WS)
- Implement certificate pinning for API calls
- Regular security audits of encryption implementation
- Keep TweetNaCl.js and dependencies updated

## Troubleshooting

### Connection Issues

**WebSocket connection fails:**
```bash
# Check backend services are running
# Verify VITE_WS_URL and VITE_CALL_WS_URL in .env
# Check browser console for connection errors
```

**API requests fail:**
```bash
# Ensure VITE_API_URL points to correct User Service
# Check CORS headers on backend
# Verify JWT token is valid
```

### Call Issues

**Camera/Microphone not working:**
- Check browser permissions
- Allow camera/mic access in browser settings
- Ensure camera/mic aren't in use by another app

**No video/audio from peer:**
- Verify both peers are on stable internet
- Check firewall allows WebRTC
- Ensure STUN/TURN servers configured if needed

**Call signaling fails:**
- Verify Call Service is running on correct port
- Check Socket.IO connection established
- Review console for WebRTC errors

### Build Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
npm run build -- --force

# Check for TypeScript errors (if applicable)
npm run type-check
```

### Message Encryption Issues

**Messages not decrypting:**
- Verify recipient's public key is available
- Check private key in IndexedDB
- Ensure same encryption service used on both ends

**Key Generation Failed:**
- Clear IndexedDB: DevTools → Application → Storage
- Logout and login again to regenerate keys
- Check browser console for crypto errors

## Production Deployment

### Build Optimization
```bash
npm run build  # Creates optimized dist/ directory
```

### Deployment Options

**Vercel** (recommended for Next.js but works with Vite):
```bash
vercel deploy
```

**Netlify:**
```bash
netlify deploy --prod --dir=dist
```

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

**Static Hosting** (AWS S3, GitHub Pages, etc.):
```bash
npm run build
# Upload dist/ folder contents
```

### Environment Setup for Production
```env
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=https://chat.yourdomain.com
VITE_CALL_WS_URL=https://call.yourdomain.com
```

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following code style
3. Test thoroughly in development
4. Commit with clear messages: `git commit -m "Add feature X"`
5. Push and create Pull Request

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [WebRTC MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [TweetNaCl.js](https://tweetnacl.js.org/)

## License

See root README.md for project license information.

## Support

For issues, questions, or feature requests, please open an issue in the repository.
