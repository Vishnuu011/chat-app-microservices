from src.config.db import get_db
from src.middlewares.isAuth import isAuth
from src.schema.callSchema import (
    StartCallRequest,
    CallResponse,
    EndCallResponse,
    CallHistoryItem,
    CallHistoryResponse
)
from fastapi import Depends, HTTPException, status, APIRouter
from src.controllers.callService import getAllCalls, startCall, endCall
from bson import ObjectId
from bson.errors import InvalidId
from typing import Any, Dict, Optional


call_router = APIRouter()


@call_router.post(
    "/start-call",
    response_model=CallResponse
)
async def start_call_router(
    data: StartCallRequest,
    user: dict = Depends(isAuth),
    db: Any = Depends(get_db)
) -> Optional[CallResponse]:

    return await startCall(
        data=data,
        user=user,
        db=db
    )



@call_router.post(
    "/end-call/{callId}",
    response_model=EndCallResponse
)
async def end_call_router(
    callId: str,
    user: dict = Depends(isAuth),
    db: Any = Depends(get_db)
) -> Optional[EndCallResponse]:

    return await endCall(
        callId=callId,
        user=user,
        db=db
    )



@call_router.get(
    "/history",
    response_model=CallHistoryResponse
)
async def get_calls_router(
    user: dict = Depends(isAuth),
    db: Any = Depends(get_db)
) -> CallHistoryResponse:

    return await getAllCalls(
        user=user,
        db=db
    )
