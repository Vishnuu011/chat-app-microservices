from fastapi import FastAPI
from src.config.db import connectDB, closeDB
import uvicorn

app=FastAPI()

@app.on_event("startup")
async def startup():
    await connectDB()

@app.on_event("shutdown")
async def shutdown():
    await closeDB()  
    
     
if __name__=="__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
