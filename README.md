# 💬 Chat App - Real-Time Communication

Microservices-based chat & calling platform. Real-time messaging, voice/video calls, OTP auth, email notifications.

---

## 🛠️ Technology Stack

### Backend

<table align="center">
<tr>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg" width="60"/><br>FastAPI
</td>

<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg" width="60"/><br>Socket.IO
</td>

<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" width="60"/><br>MongoDB
</td>

<td align="center">
<img src="https://motor.readthedocs.io/en/stable/_images/motor.png" width="60"/><br>Motor
</td>
</tr>

<tr>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" width="60"/><br>Redis
</td>

<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rabbitmq/rabbitmq-original.svg" width="60"/><br>RabbitMQ
</td>

<td align="center">
<img src="https://www.vectorlogo.zone/logos/sendgrid/sendgrid-icon.svg" width="60"/><br>SendGrid
</td>

<td align="center">
<img src="https://camo.githubusercontent.com/aea88ea1298578df183d68b79dab6a8aa3f32bfa5ff358939672ea364517cdb3/68747470733a2f2f7374617469632e766964656f73646b2e6c6976652f766964656f73646b5f6c6f676f5f776562736974655f626c61636b2e706e67" width="60"/><br>VideoSDK
</td>
</tr>

<tr>
<td align="center">
<img src="https://uvicorn.dev/uvicorn.png" width="60"/><br>Uvicorn
</td>

<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="60"/><br>Python
</td>

<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="60"/><br>Docker
</td>
</tr>

</table>


### Frontend

<table align="center">
<tr>
<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="70"/><br>React
</td>

<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="70"/><br>Vite
</td>

<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="70"/><br>TypeScript
</td>

<td align="center">
<img src="https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-icon.svg" width="70"/><br>Tailwind CSS
</td>
</tr>

<tr>
<td align="center">
<img src="https://user-images.githubusercontent.com/958486/218346783-72be5ae3-b953-4dd7-b239-788a882fdad6.svg" width="70"/><br>Zustand
</td>

<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg" width="70"/><br>Socket.IO Client
</td>

<td align="center">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/axios/axios-plain.svg" width="70"/><br>Axios
</td>
</tr>
</table>


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

<p align="center">
  <img src="chatapp_real_architecture.svg" width="800"/>
</p>

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
