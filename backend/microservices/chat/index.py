from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
import time
from src.config.db import connectDB, closeDB
from src.routers import chatRouter
import uvicorn
import socketio
from src.config.config import settings
from src.socket.socket_app import sio




app=FastAPI(
    title="chat service API",
    description="A simple chat API bulit with FastAPI",
    version="1.0.0"
)

socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app
)



@app.on_event("startup")
async def startup():
    await connectDB()

@app.on_event("shutdown")
async def shutdown():
    await closeDB()  
 

allow_origins = [
    "https://test-frontent-eight.vercel.app"
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





app.include_router(
    router=chatRouter.chat_router,
    prefix="/api/v1",
    tags=["chat services API Router"]

)


@app.get(
    "/",
    status_code=status.HTTP_200_OK
)   
async def healthCheck():
    return {
        "message":"chat service is healthy"
    }

     
if __name__ == "__main__":
    uvicorn.run(
        "index:socket_app",
        host="0.0.0.0",
        port=8002,
        reload=True
    )