# Chat App - Secure Real-Time Communication

A complete microservices-based chat and calling application with end-to-end encryption.

## Project Structure

```
chat-app/
├── backend/          # Python FastAPI microservices
│   └── microservices/
│       ├── user/     # Authentication & user management
│       ├── chat/     # Messaging service
│       ├── call/     # Voice/video calling
│       └── mail/     # Email notifications
└── frontend/         # React + Vite application
```

## Features

- 🔐 **End-to-End Encryption** - X25519 + AES-256-GCM
- 💬 **Real-time Chat** - WebSocket messaging
- 📞 **Voice/Video Calls** - WebRTC
- 🔑 **OTP Authentication** - Secure login
- 👥 **User Directory** - Find and add contacts
- 📱 **Responsive UI** - Works on all devices

## Quick Start

### Backend
```bash
cd backend/microservices/user
pip install -r requirements.txt
python index.py  # Runs on :8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Runs on :5173
```

## Technology Stack

**Backend:**
- FastAPI (Python)
- MongoDB
- Socket.IO (WebSocket)
- Docker
- RabbitMQ
- redis python
- SendGrid (Email API & SMTP)

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Zustand
- TweetNaCl.js (Encryption)

## Services

| Service | Port | Purpose |
|---------|------|---------|
| User | 8000 | Auth, user CRUD, public keys |
| Chat | 8002 | Messaging, chat rooms |
| Call | 8003 | Call signaling, WebRTC |
| Mail | 8001 | Email notifications |

## Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- Service-specific READMEs in each microservice folder

## Getting Started

1. Install dependencies for both frontend and backend
2. Set up environment variables
3. Start microservices (can use Docker)
4. Start frontend dev server
5. Open http://localhost:5173 in browser

## License

MIT
