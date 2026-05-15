# Chat Service

Real-time messaging service with WebSocket support.

## Features

- Create & manage chat conversations
- Send messages
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

- `GET /api/v1/chat/all` - Get all conversations
- `POST /api/v1/chat/new` - Create new chat
- `GET /api/v1/messages/{chatId}` - Get chat messages
- `POST /api/v1/message` - Send message

## WebSocket Events

### Emit
- `joinChat` - Join a chat room
- `leaveChat` - Leave a chat room
- `sendMessage` - Send message 
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
