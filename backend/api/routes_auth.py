"""Authentication API routes."""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from services.auth import register_user, login_user, get_user_by_id, verify_token

router = APIRouter()


class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def get_current_user(request: Request) -> dict:
    """Extract and verify JWT from Authorization header."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = auth[7:]
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(401, "Invalid or expired token")
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(401, "User not found")
    return user


@router.post("/auth/register")
async def register(req: RegisterRequest):
    if len(req.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    if not req.name.strip():
        raise HTTPException(400, "Name is required")
    result = register_user(req.email, req.name, req.password)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.post("/auth/login")
async def login(req: LoginRequest):
    result = login_user(req.email, req.password)
    if "error" in result:
        raise HTTPException(401, result["error"])
    return result


@router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user
