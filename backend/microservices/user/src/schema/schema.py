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

class UpdateNameRequest(BaseModel):
    name:str   

class UpdateNameResponds(BaseModel):
    responds:str
    user_info: dict
    token:str   

class GetAUserRequest(BaseModel):
    id:str     