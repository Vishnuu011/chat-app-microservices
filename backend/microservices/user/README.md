# User Service

User authentication, profile management, and public key storage.

## Features

- OTP-based authentication
- User registration & login
- User directory / search
- Profile management
- Public key storage (for E2E encryption)

## Setup

```bash
pip install -r requirements.txt
export DATABASE_URL
export REDIS_URL
export RABBITMQ_URL
export SECRET_KEY
export ALGORITHM
export ACCESS_TOKEN_EXPIRE_HOURS
export ALLOW_ORIGINS
python index.py
```

## Port

Runs on **8000**

## API Endpoints

- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and get JWT token
- `GET /api/users/` - Get all users
- `GET /api/users/{id}` - Get user profile
- `POST /api/users/{id}` - Update profile
- `POST /api/public-key` - Upload public key
- `GET /api/public-key/{id}` - Get user's public key

## Database Models

- **User** - Email, name, avatar, public key, settings
- **OTP** - Email, code, expiry

## Environment Variables

```
DATABASE_URL
REDIS_URL
RABBITMQ_URL
SECRET_KEY
ALGORITHM
ACCESS_TOKEN_EXPIRE_HOURS
ALLOW_ORIGINS
```

## Socket Events

- None (REST API only)
