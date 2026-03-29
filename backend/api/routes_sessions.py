"""API routes for persistent chat sessions."""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from services import chat_store
from services.auth import verify_token

router = APIRouter()


def _get_user_id(request: Request) -> Optional[str]:
    """Extract user_id from JWT if present."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return verify_token(auth[7:])
    return None


class CreateSessionRequest(BaseModel):
    name: Optional[str] = "New Session"
    file_session_id: Optional[str] = None


class RenameSessionRequest(BaseModel):
    name: str


class AddMessageRequest(BaseModel):
    role: str
    content: str
    csv_data: Optional[str] = None
    citations: Optional[list] = None
    is_error: Optional[bool] = False


@router.get("/sessions")
async def list_sessions(request: Request):
    user_id = _get_user_id(request)
    return chat_store.list_sessions(user_id=user_id)


@router.post("/sessions")
async def create_session(req: CreateSessionRequest, request: Request):
    user_id = _get_user_id(request)
    return chat_store.create_session(name=req.name, file_session_id=req.file_session_id, user_id=user_id)


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    session = chat_store.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@router.patch("/sessions/{session_id}")
async def rename_session(session_id: str, req: RenameSessionRequest):
    session = chat_store.rename_session(session_id, req.name)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    ok = chat_store.delete_session(session_id)
    if not ok:
        raise HTTPException(404, "Session not found")
    return {"status": "deleted"}


@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str):
    return chat_store.get_messages(session_id)


@router.post("/sessions/{session_id}/messages")
async def add_message(session_id: str, req: AddMessageRequest):
    return chat_store.add_message(
        chat_session_id=session_id,
        role=req.role,
        content=req.content,
        csv_data=req.csv_data,
        citations=req.citations,
        is_error=req.is_error,
    )
