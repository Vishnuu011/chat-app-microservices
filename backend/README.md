# Backend - Microservices

Python/FastAPI backend with 4 independent microservices for real-time chat and calling.

## Microservices

```
microservices/
├── user/      # Auth, user management, public keys (Port 8000)
├── chat/      # Messaging, conversations (Port 8002)
├── call/      # Call signaling, WebRTC (Port 8003)
└── mail/      # Email notifications (Consumer)
```

## Quick Start

```bash
cd microservices/user
pip install -r requirements.txt
python index.py
```

## Tech Stack

- **Framework:** FastAPI
- **Database:** MongoDB
- **Real-time:** Socket.IO (WebSocket)
- **Containerization:** Docker



## Service Documentation

See individual README files in each service folder for detailed documentation.

## Ports

- User Service: **8000**
- Mail Service: **8001**
- Chat Service: **8002**
- Call Service: **8003**
