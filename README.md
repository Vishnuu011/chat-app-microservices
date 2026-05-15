# 💬 Chat App - Real-Time Communication

Microservices-based chat & calling platform. Real-time messaging, voice/video calls, OTP auth, email notifications.

---

## 🛠️ Technology Stack

### Backend
```
<p align="center"> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg" width="70"/> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg" width="70"/> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" width="70"/> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="70"/> </p> <p align="center"> <b>FastAPI</b> &nbsp;&nbsp;&nbsp; <b>Socket.IO</b> &nbsp;&nbsp;&nbsp; <b>MongoDB</b> &nbsp;&nbsp;&nbsp; <b>Motor (Async Mongo Driver)</b> </p>
<p align="center"> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" width="70"/> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rabbitmq/rabbitmq-original.svg" width="70"/> <img src="https://www.vectorlogo.zone/logos/sendgrid/sendgrid-icon.svg" width="70"/> <img src="https://avatars.githubusercontent.com/u/88696189?s=200&v=4" width="70"/> </p> <p align="center"> <b>Redis</b> &nbsp;&nbsp;&nbsp; <b>RabbitMQ</b> &nbsp;&nbsp;&nbsp; <b>SendGrid</b> &nbsp;&nbsp;&nbsp; <b>VideoSDK</b> </p>
<p align="center"> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/uvicorn/uvicorn-original.svg" width="70"/> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="70"/> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="70"/> </p> <p align="center"> <b>Uvicorn</b> &nbsp;&nbsp;&nbsp; <b>Python</b> &nbsp;&nbsp;&nbsp; <b>Docker</b> </p>
```

### Frontend
```
<p align="center"> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="70"/> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="70"/> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="70"/> <img src="https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-icon.svg" width="70"/> </p> <p align="center"> <b>React</b> &nbsp;&nbsp;&nbsp; <b>Vite</b> &nbsp;&nbsp;&nbsp; <b>TypeScript</b> &nbsp;&nbsp;&nbsp; <b>Tailwind CSS</b> </p>
<p align="center"> <img src="https://raw.githubusercontent.com/pmndrs/zustand/main/docs/logo.png" width="70"/> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg" width="70"/> <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/axios/axios-plain.svg" width="70"/> </p> <p align="center"> <b>Zustand</b> &nbsp;&nbsp;&nbsp; <b>Socket.IO Client</b> &nbsp;&nbsp;&nbsp; <b>Axios</b> </p>
```

---

## 📋 Services

| Service | Port | Tech |
|---------|------|------|
| **User** | 8000 | FastAPI + MongoDB + Redis |
| **Chat** | 8002 | FastAPI + Socket.IO + MongoDB |
| **Call** | 8003 | FastAPI + Socket.IO + VideoSDK |
| **Mail** | 8001 | FastAPI + RabbitMQ + SendGrid |

---

## 🔒 Core Features

✅ Real-time messaging (Socket.IO)  
✅ Voice/video calls (VideoSDK)  
✅ OTP + JWT authentication  
✅ File uploads  
✅ Call history  
✅ Email notifications (SendGrid)  
✅ Async tasks (RabbitMQ)  
✅ Session caching (Redis)  
✅ Containerized (Docker)  

---

## 🎯 Overview

**Chat App** is a comprehensive real-time communication platform that combines instant messaging with high-quality voice and video calling. Built with a modern microservices architecture, it separates concerns into independent, scalable services while maintaining data integrity and security across the platform.

### Key Capabilities:
- **Real-time Messaging** - Instant chat with Socket.IO WebSocket support
- **Voice & Video Calls** - Peer-to-peer calling via VideoSDK
- **User Authentication** - Secure OTP-based login with JWT tokens
- **Email Notifications** - Transactional emails via SendGrid
- **Message Queue Processing** - Asynchronous task handling with RabbitMQ
- **High-Performance Caching** - Redis for sessions and data caching
- **Container Orchestration** - Docker for consistent deployment
- **Horizontal Scalability** - Microservices architecture for independent scaling

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Frontend)                    │
│  React + Vite + TypeScript + Tailwind CSS + Socket.IO Client       │
│                      Port: 5173 (Dev) / 3000 (Prod)                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
      ┌──────────┐    ┌──────────┐    ┌──────────┐
      │ HTTP/REST│    │ WebSocket│    │ WebSocket│
      │ Requests │    │  Events  │    │  Events  │
      └──────────┘    └──────────┘    └──────────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   ┌──────────┐         ┌──────────┐        ┌──────────┐
   │   User   │         │   Chat   │        │   Call   │
   │ Service  │         │ Service  │        │ Service  │
   │ Port:8000         │ Port:8002 │        │ Port:8003 │
   └──────────┘         └──────────┘        └──────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   ┌──────────┐         ┌──────────┐        ┌──────────┐
   │ MongoDB  │         │ RabbitMQ │        │  Redis   │
   │ Database │         │   Queue  │        │  Cache   │
   └──────────┘         └──────────┘        └──────────┘
        │                    │                    │
        ▼                    ▼                    ▼
   Data Storage      Task Processing    Session/Cache
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ Mail Service    │
                    │ (SendGrid)      │
                    │ Port: 8001      │
                    └─────────────────┘
                             │
                    ┌────────▼────────┐
                    │  SendGrid API   │
                    │  Email Delivery │
                    └─────────────────┘

        ┌─────────────────────────────────────┐
        │   External Services                 │
        ├─────────────────────────────────────┤
        │ • VideoSDK - Live Video/Audio       │
        │ • SendGrid - Email Provider         │
        │ • MongoDB Atlas - Cloud Database    │
        └─────────────────────────────────────┘
```

### Backend Technologies

| Layer | Technology | Purpose | Version |
|-------|-----------|---------|---------|
| **Framework** | FastAPI | High-performance async Python web framework | 0.104+ |
| **Server** | Uvicorn | ASGI server for running FastAPI applications | 0.24+ |
| **Real-time** | Socket.IO (python-socketio) | WebSocket communication for messaging & calls | 5.9+ |
| **Database** | MongoDB | NoSQL document database for scalable data storage | 5.0+ |
| **Async Driver** | Motor | Async MongoDB driver for FastAPI | 3.3+ |
| **Authentication** | Python-Jose | JWT token generation and validation | 3.3+ |
| **Email Service** | SendGrid | Email delivery for notifications and transactional emails | - |
| **Message Queue** | RabbitMQ | Asynchronous task queue for background jobs | 3.12+ |
| **Caching** | Redis | In-memory cache for sessions and real-time data | 7.0+ |
| **Containerization** | Docker | Container platform for deployment and scalability | 24+ |
| **Video/Audio** | VideoSDK | Third-party service for peer-to-peer media streaming | - |

### Frontend Technologies

| Layer | Technology | Purpose | Version |
|-------|-----------|---------|---------|
| **Framework** | React | UI component library and state management | 18+ |
| **Build Tool** | Vite | Fast build tool and development server | 5.0+ |
| **Language** | TypeScript | Type-safe JavaScript for better code quality | 5.0+ |
| **Styling** | Tailwind CSS | Utility-first CSS framework | 3.3+ |
| **State Management** | Zustand | Lightweight state management library | 4.4+ |
| **Real-time** | Socket.IO Client | WebSocket client for real-time communication | 4.5+ |
| **HTTP Client** | Axios | Promise-based HTTP client for API calls | 1.6+ |
| **Video Call** | VideoSDK.live | Client SDK for video calling integration | - |

### Infrastructure & DevOps

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker | Package applications with dependencies |
| **Orchestration** | Docker Compose | Multi-container orchestration for development |
| **Version Control** | Git | Source code management |
| **CI/CD** | GitHub Actions (Optional) | Automated testing and deployment |

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Support & Contact

For questions, issues, or suggestions:
- Open an issue on GitHub

---

**Last Updated:** May 16, 2026  
**Status:** ✅ Production Ready
