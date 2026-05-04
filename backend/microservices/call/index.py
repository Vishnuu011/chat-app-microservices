from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
import time
from src.routers import callRouter
from src.config.db import connectDB, closeDB
from src.routers import callRouter
import uvicorn
import socketio
from src.socket.socket_app import sio




app=FastAPI(
    title="call service API",
    description="A simple call API built with FastAPI",
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
 

allow_origins=["http://localhost:3000"]

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
    router=callRouter.call_router,
    prefix="/api/v1",
    tags=["call services API Router"]

)


@app.get(
    "/",
    status_code=status.HTTP_200_OK
)   
async def healthCheck():
    return {
        "message":"video, voice call service is healthy"
    }

     
if __name__ == "__main__":
    uvicorn.run(
        "index:socket_app",
        host="0.0.0.0",
        port=8003,
        reload=True
    )