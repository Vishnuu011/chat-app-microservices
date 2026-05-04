from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    email: str

class LoginResponds(BaseModel):
    responds: str    

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class VerifyOTPResponds(BaseModel):
    responds: str
    userinfo: dict
    token: str

class UpdateNameRequest(BaseModel):
    name:str   

class UpdateNameResponds(BaseModel):
    responds:str
    user_info: dict
    token:str

class UpdatePublicKeyRequest(BaseModel):
    publicKey: str

class UpdatePublicKeyResponds(BaseModel):
    responds: str
    publicKey: str

class GetAUserRequest(BaseModel):
    id:str