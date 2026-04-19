from pydantic import BaseModel

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