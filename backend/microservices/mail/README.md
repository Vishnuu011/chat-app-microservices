# Mail Service

Email notification service using message queue consumer pattern.

## Features

- Send OTP emails
- Send notification emails
- Queue-based message consumption
- Retry logic
- Email templating

## Setup

```bash
pip install -r requirements.txt
export DATABASE_URL=mongodb://localhost:27017/chat_app
export MAIL_FROM=XXXXXXXXXX@gmail.com
export SENDGRID_API_KEY=your_sendgrid_api_key
export RABBITMQ_URL=amqp://guest:guest@localhost:5672/
python index.py
```

## Port

**No HTTP port** - This is a consumer service

## Consumer Queues

Listens to RabbitMQ queues for:
- `otp_emails` - OTP email requests
- `notification_emails` - General notifications

## Processing

1. Receives email job from queue
2. Renders email template
3. Sends via SendGrid API
4. Logs delivery status
5. Retries on failure

## Email Templates

- OTP verification email
- Welcome email
- Call summary email
- General notifications

## Environment Variables

```
DATABASE_URL
MAIL_FROM
SENDGRID_API_KEY
RABBITMQ_URL
```

## Configuration

- Email Provider: SendGrid
- Max Retries: 3
- Retry Delay: 5 seconds
