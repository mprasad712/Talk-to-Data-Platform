"""CRUD operations for chat sessions and messages."""

import json
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session as DBSession
from services.database import SessionLocal, ChatSession, ChatMessage


def _get_db() -> DBSession:
    return SessionLocal()


def create_session(name: str = "New Session", file_session_id: str = None, user_id: str = None) -> dict:
    db = _get_db()
    try:
        session = ChatSession(
            session_id=str(uuid.uuid4()),
            name=name,
            file_session_id=file_session_id,
            user_id=user_id,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session.to_dict()
    finally:
        db.close()


def list_sessions(user_id: str = None) -> list:
    db = _get_db()
    try:
        q = db.query(ChatSession)
        if user_id:
            q = q.filter(ChatSession.user_id == user_id)
        sessions = q.order_by(ChatSession.updated_at.desc()).all()
        return [s.to_dict() for s in sessions]
    finally:
        db.close()


def get_session(chat_session_id: str) -> Optional[dict]:
    db = _get_db()
    try:
        session = db.query(ChatSession).filter(ChatSession.session_id == chat_session_id).first()
        if not session:
            return None
        result = session.to_dict()
        result["messages"] = [m.to_dict() for m in session.messages]
        return result
    finally:
        db.close()


def rename_session(chat_session_id: str, name: str) -> Optional[dict]:
    db = _get_db()
    try:
        session = db.query(ChatSession).filter(ChatSession.session_id == chat_session_id).first()
        if not session:
            return None
        session.name = name
        session.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(session)
        return session.to_dict()
    finally:
        db.close()


def delete_session(chat_session_id: str) -> bool:
    db = _get_db()
    try:
        session = db.query(ChatSession).filter(ChatSession.session_id == chat_session_id).first()
        if not session:
            return False
        db.delete(session)
        db.commit()
        return True
    finally:
        db.close()


def add_message(chat_session_id: str, role: str, content: str,
                csv_data: str = None, citations: list = None,
                thoughts: list = None, is_error: bool = False) -> dict:
    db = _get_db()
    try:
        msg = ChatMessage(
            session_id=chat_session_id,
            role=role,
            content=content,
            csv_data=csv_data,
            citations=json.dumps(citations) if citations else None,
            thoughts=json.dumps(thoughts) if thoughts else None,
            is_error=is_error,
        )
        db.add(msg)
        # Update session timestamp and auto-name from first user message
        session = db.query(ChatSession).filter(ChatSession.session_id == chat_session_id).first()
        if session:
            session.updated_at = datetime.now(timezone.utc)
            if role == "user" and session.name == "New Session":
                session.name = content[:60]
        db.commit()
        db.refresh(msg)
        return msg.to_dict()
    finally:
        db.close()


def get_messages(chat_session_id: str) -> list:
    db = _get_db()
    try:
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == chat_session_id)
            .order_by(ChatMessage.created_at)
            .all()
        )
        return [m.to_dict() for m in messages]
    finally:
        db.close()
