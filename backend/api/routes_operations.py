"""API routes for data operations (join, union, filter, group, sort, deduplicate, column tools)."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from io import StringIO
from services.data_operations import OPERATIONS, _execute_operation, save_operation_result
from services.file_manager import get_session
import pandas as pd

router = APIRouter()


class OperationRequest(BaseModel):
    session_id: str
    operation: str  # join, union, filter, group, sort, deduplicate, column_tools
    params: Dict[str, Any]


class SaveResultRequest(BaseModel):
    session_id: str
    operation: str
    params: Dict[str, Any]
    name: str  # filename for the saved result (without .csv)


@router.post("/data/operations/preview")
async def preview_operation(req: OperationRequest):
    """Execute an operation and return a preview (first 50 rows) + schema."""
    if req.operation not in OPERATIONS:
        raise HTTPException(400, f"Unknown operation: {req.operation}. Valid: {list(OPERATIONS.keys())}")

    session = get_session(req.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    try:
        result = OPERATIONS[req.operation](req.session_id, req.params)
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except KeyError as e:
        raise HTTPException(400, f"Missing parameter: {e}")
    except Exception as e:
        raise HTTPException(500, f"Operation failed: {str(e)}")


@router.post("/data/operations/save")
async def save_result(req: SaveResultRequest):
    """Execute an operation and save the result as a new CSV in the session."""
    if req.operation not in OPERATIONS:
        raise HTTPException(400, f"Unknown operation: {req.operation}")

    session = get_session(req.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    try:
        file_info = save_operation_result(req.session_id, req.name, req.params, req.operation)
        return {"status": "saved", "file": file_info}
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Save failed: {str(e)}")


class DownloadOperationRequest(BaseModel):
    session_id: str
    operation: str
    params: Dict[str, Any]
    name: str


@router.post("/data/operations/download")
async def download_operation_result(req: DownloadOperationRequest):
    """Re-run operation and return full CSV for download."""
    session = get_session(req.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    try:
        df = _execute_operation(req.session_id, req.operation, req.params)
        csv_buf = StringIO()
        df.to_csv(csv_buf, index=False)
        csv_buf.seek(0)
        return StreamingResponse(
            csv_buf,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{req.name}.csv"'},
        )
    except Exception as e:
        raise HTTPException(500, f"Download failed: {str(e)}")


@router.get("/data/download/{session_id}/{filename}")
async def download_file(session_id: str, filename: str):
    """Download the full CSV file from the session."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    file_info = session["files"].get(filename)
    if not file_info:
        raise HTTPException(404, f"File not found: {filename}")

    file_path = file_info["path"]
    df = pd.read_csv(file_path, encoding="utf-8", errors="replace")
    csv_buf = StringIO()
    df.to_csv(csv_buf, index=False)
    csv_buf.seek(0)

    return StreamingResponse(
        csv_buf,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/data/columns/{session_id}")
async def get_all_columns(session_id: str):
    """Return column info for all files in a session — used by workbench UI."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    result = {}
    for filename, info in session["files"].items():
        result[filename] = info["schema"]["columns"]

    return result
