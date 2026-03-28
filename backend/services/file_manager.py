import os
import uuid
from typing import Dict, List, Optional
import pandas as pd
from pathlib import Path
from config import settings
from services.data_cleaner import clean_dataframe

# In-memory session store
_sessions: Dict[str, dict] = {}


def get_or_create_session(session_id: Optional[str] = None) -> str:
    if session_id and session_id in _sessions:
        return session_id
    sid = session_id or str(uuid.uuid4())
    session_dir = Path(settings.UPLOAD_DIR) / sid
    session_dir.mkdir(parents=True, exist_ok=True)
    _sessions[sid] = {"files": {}, "dataset_context": None, "cleaning_reports": {}, "relationships": []}
    return sid


def get_session(session_id: str) -> Optional[dict]:
    return _sessions.get(session_id)


def save_file(session_id: str, filename: str, content: bytes) -> dict:
    session_dir = Path(settings.UPLOAD_DIR) / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    file_path = session_dir / filename

    # Write raw file first
    file_path.write_bytes(content)

    # Read, clean, and overwrite with cleaned version
    try:
        raw_df = pd.read_csv(str(file_path), encoding="utf-8", encoding_errors="replace")
    except UnicodeDecodeError:
        raw_df = pd.read_csv(str(file_path), encoding="latin-1")

    cleaned_df, cleaning_report = clean_dataframe(raw_df, filename)

    # Save cleaned CSV back to disk
    cleaned_df.to_csv(str(file_path), index=False)

    # Extract schema from cleaned data
    schema = extract_schema_from_df(cleaned_df)

    if session_id not in _sessions:
        _sessions[session_id] = {"files": {}, "dataset_context": None, "cleaning_reports": {}}

    _sessions[session_id]["files"][filename] = {
        "path": str(file_path),
        "schema": schema,
    }
    _sessions[session_id]["cleaning_reports"][filename] = cleaning_report
    # Invalidate cached dataset context when files change
    _sessions[session_id]["dataset_context"] = None

    return {"filename": filename, **schema, "cleaning_report": cleaning_report}


def extract_schema_from_df(df: pd.DataFrame) -> dict:
    """Extract schema from an in-memory DataFrame."""
    columns = []
    for col in df.columns:
        col_info = {
            "name": col,
            "dtype": str(df[col].dtype),
            "null_count": int(df[col].isnull().sum()),
            "unique_count": int(df[col].nunique()),
            "sample_values": [str(v) for v in df[col].dropna().head(3).tolist()],
        }
        columns.append(col_info)

    return {
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": columns,
    }


def extract_schema(file_path: str) -> dict:
    """Extract schema by reading CSV from disk."""
    try:
        full_df = pd.read_csv(file_path, encoding="utf-8", encoding_errors="replace")
    except UnicodeDecodeError:
        full_df = pd.read_csv(file_path, encoding="latin-1")
    return extract_schema_from_df(full_df)


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


def get_cleaning_reports(session_id: str) -> dict:
    session = _sessions.get(session_id)
    if not session:
        return {}
    return session.get("cleaning_reports", {})


def delete_file(session_id: str, filename: str) -> bool:
    session = _sessions.get(session_id)
    if not session or filename not in session["files"]:
        return False
    file_path = Path(session["files"][filename]["path"])
    if file_path.exists():
        file_path.unlink()
    del session["files"][filename]
    session.get("cleaning_reports", {}).pop(filename, None)
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


def set_relationships(session_id: str, relationships: List[dict]):
    """Store LLM-detected relationships in session."""
    if session_id in _sessions:
        _sessions[session_id]["relationships"] = relationships


def get_relationships(session_id: str) -> List[dict]:
    session = _sessions.get(session_id)
    if not session:
        return []
    return session.get("relationships", [])
