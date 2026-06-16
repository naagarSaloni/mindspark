from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str
    role: str
    unique_id: str

class LoginRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict
