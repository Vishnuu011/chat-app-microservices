# Chat Service

Real-time messaging service with WebSocket support.

## Features

- Create & manage chat conversations
- Send encrypted messages
- Real-time WebSocket messaging
- Message history
- Typing indicators
- Online/offline status
- Message seen status

## Setup

```bash
pip install -r requirements.txt
export DATABASE_URL=mongodb://localhost:27017/chat_app
export SECRET=your_secret_key
export CLOUDINARY_NAME=your_cloudinary_name
python index.py
```

## Port

Runs on **8002**

## API Endpoints

- `GET /api/chats` - Get all conversations
- `POST /api/chats` - Create new chat
- `GET /api/chats/{id}/messages` - Get chat messages
- `POST /api/chats/{id}/messages` - Send message

## WebSocket Events

### Emit
- `joinChat` - Join a chat room
- `leaveChat` - Leave a chat room
- `sendMessage` - Send message (encrypted)
- `typing` - User typing
- `stopTyping` - Stop typing

### Listen
- `newMessage` - Receive message
- `messageSeen` - Message marked read
- `userTyping` - User typing
- `userStoppedTyping` - User stopped
- `getOnlineUsers` - Online users list


## Environment Variables

```
DATABASE_URL
JWT_SECRET
CLOUDINARY_NAME
CLOUDINARY_KEY
CLOUDINARY_SECRET
```
