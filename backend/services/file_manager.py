import os
import uuid
from typing import Dict, List, Optional
import pandas as pd
from pathlib import Path
from config import settings

# In-memory session store
_sessions: Dict[str, dict] = {}


def get_or_create_session(session_id: Optional[str] = None) -> str:
    if session_id and session_id in _sessions:
        return session_id
    sid = session_id or str(uuid.uuid4())
    session_dir = Path(settings.UPLOAD_DIR) / sid
    session_dir.mkdir(parents=True, exist_ok=True)
    _sessions[sid] = {"files": {}, "dataset_context": None}
    return sid


def get_session(session_id: str) -> Optional[dict]:
    return _sessions.get(session_id)


def save_file(session_id: str, filename: str, content: bytes) -> dict:
    session_dir = Path(settings.UPLOAD_DIR) / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    file_path = session_dir / filename
    file_path.write_bytes(content)

    schema = extract_schema(str(file_path))

    if session_id not in _sessions:
        _sessions[session_id] = {"files": {}, "dataset_context": None}

    _sessions[session_id]["files"][filename] = {
        "path": str(file_path),
        "schema": schema,
    }
    # Invalidate cached dataset context when files change
    _sessions[session_id]["dataset_context"] = None

    return {"filename": filename, **schema}


def extract_schema(file_path: str) -> dict:
    try:
        df = pd.read_csv(file_path, nrows=5, encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(file_path, nrows=5, encoding="latin-1")

    full_df = pd.read_csv(file_path, encoding="utf-8", encoding_errors="replace")
    row_count = len(full_df)

    columns = []
    for col in df.columns:
        col_info = {
            "name": col,
            "dtype": str(full_df[col].dtype),
            "null_count": int(full_df[col].isnull().sum()),
            "unique_count": int(full_df[col].nunique()),
            "sample_values": [str(v) for v in full_df[col].dropna().head(3).tolist()],
        }
        columns.append(col_info)

    return {
        "row_count": row_count,
        "column_count": len(df.columns),
        "columns": columns,
    }


def get_file_paths(session_id: str) -> List[str]:
    session = _sessions.get(session_id)
    if not session:
        return []
    return [info["path"] for info in session["files"].values()]


def get_file_schemas(session_id: str) -> dict:
    session = _sessions.get(session_id)
    if not session:
        return {}
    return {name: info["schema"] for name, info in session["files"].items()}


def delete_file(session_id: str, filename: str) -> bool:
    session = _sessions.get(session_id)
    if not session or filename not in session["files"]:
        return False
    file_path = Path(session["files"][filename]["path"])
    if file_path.exists():
        file_path.unlink()
    del session["files"][filename]
    session["dataset_context"] = None
    return True


def get_dataset_context(session_id: str) -> Optional[str]:
    session = _sessions.get(session_id)
    if not session:
        return None
    return session.get("dataset_context")


def set_dataset_context(session_id: str, context: str):
    if session_id in _sessions:
        _sessions[session_id]["dataset_context"] = context
