"""Authentication service — HMAC tokens + password hashing."""

import uuid
import hmac
import hashlib
import json
import base64
import time
from typing import Optional
from services.database import SessionLocal, User

SECRET_KEY = "bcn-coro-secret-key-change-in-production"
TOKEN_EXPIRY_SECONDS = 7 * 24 * 3600  # 7 days


def _hash_password(password: str) -> str:
    """Hash password with salt using SHA-256."""
    salt = uuid.uuid4().hex
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${hashed}"


def _verify_password(password: str, stored: str) -> bool:
    """Verify password against stored hash."""
    salt, hashed = stored.split("$", 1)
    return hashlib.sha256((salt + password).encode()).hexdigest() == hashed


def _get_db():
    return SessionLocal()


def register_user(email: str, name: str, password: str) -> dict:
    db = _get_db()
    try:
        existing = db.query(User).filter(User.email == email.lower().strip()).first()
        if existing:
            return {"error": "Email already registered"}

        user = User(
            user_id=str(uuid.uuid4()),
            email=email.lower().strip(),
            name=name.strip(),
            password_hash=_hash_password(password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = _create_token(user.user_id)
        return {"user": user.to_dict(), "token": token}
    finally:
        db.close()


def login_user(email: str, password: str) -> dict:
    db = _get_db()
    try:
        user = db.query(User).filter(User.email == email.lower().strip()).first()
        if not user or not _verify_password(password, user.password_hash):
            return {"error": "Invalid email or password"}

        token = _create_token(user.user_id)
        return {"user": user.to_dict(), "token": token}
    finally:
        db.close()


def get_user_by_id(user_id: str) -> Optional[dict]:
    db = _get_db()
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        return user.to_dict() if user else None
    finally:
        db.close()


def verify_token(token: str) -> Optional[str]:
    """Returns user_id if valid, None otherwise."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        expected_sig = hmac.new(
            SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + "=="))
        if payload.get("exp", 0) < time.time():
            return None
        return payload.get("user_id")
    except Exception:
        return None


def _create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": time.time() + TOKEN_EXPIRY_SECONDS,
        "iat": time.time(),
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    signature = hmac.new(
        SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256
    ).hexdigest()
    return f"{payload_b64}.{signature}"
