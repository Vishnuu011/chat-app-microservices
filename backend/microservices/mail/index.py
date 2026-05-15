import fastapi
from src.consumer import startSendOtpConsumer
import time
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
from src.config import settings


app=fastapi.FastAPI(
    title="mail service API",
    description="A simple mail API bulit with FastAPI",
    version="1.0.0"
)

consumer_task = None


@app.on_event("startup")
async def startup():
    global consumer_task
    consumer_task = asyncio.create_task(startSendOtpConsumer())
    print("RabbitMQ consumer started")


@app.on_event("shutdown")
async def shutdown():
    global consumer_task

    if consumer_task:
        consumer_task.cancel()

        try:
            await consumer_task
        except asyncio.CancelledError:
    
  
            print("RabbitMQ consumer stopped")

allow_origins = [
    "https://chat-app-frontend-deploy-ten.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],   
    allow_headers=["*"],
)



@app.middleware("http")
async def add_time(request, call_next):
    start = time.time()

    response = await call_next(request)

    process_time = time.time() - start
    response.headers["X-Process-Time"] = str(process_time)

    return response    



@app.get(
        "/",
        status_code=fastapi.status.HTTP_200_OK
    )
async def healthCheck():
    return {"message":"mail service is healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "index:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )