from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time
from src.config.db import connectDB, closeDB
from src.routers import chatRouter
import uvicorn


app=FastAPI()

@app.on_event("startup")
async def startup():
    await connectDB()

@app.on_event("shutdown")
async def shutdown():
    await closeDB()  
 



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



app.include_router(
    router=chatRouter.chat_router,
    prefix="/api/v1",
    tags=["chat services"]

)

    
     
if __name__=="__main__":
    uvicorn.run(app)