from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config.db import connectDB, closeDB
from src.config.redis import connectRedis, close_redis
from src.config.rabbitmq import connectRabbitmq, close_rabbitmq
from src.routers import userRouter
import time
import uvicorn

app=FastAPI()

@app.on_event("startup")
async def startup():
    await connectDB()

@app.on_event("shutdown")
async def shutdown():
    await closeDB()  

@app.on_event("startup")
async def startup():
    await connectRedis()

@app.on_event("shutdown")
async def shutdown():
    await close_redis()

@app.on_event("startup")
async def startup():
    await connectRabbitmq()

@app.on_event("shutdown")
async def shutdown():
    await close_rabbitmq()    

## ---- Router ---- ##

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
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

app.include_router(router=userRouter.user_router, prefix="/api/v1")    
    
     
if __name__=="__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
