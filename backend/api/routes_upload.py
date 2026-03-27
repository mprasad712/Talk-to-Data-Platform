from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from services.file_manager import (
    get_or_create_session,
    save_file,
    get_file_schemas,
    delete_file,
    get_session,
)
from typing import Optional, List

router = APIRouter()


@router.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    session_id: Optional[str] = Form(None),
):
    sid = get_or_create_session(session_id)
    results = []
    for f in files:
        content = await f.read()
        info = save_file(sid, f.filename, content)
        results.append(info)
    return {"session_id": sid, "files": results}


@router.get("/datasets/{session_id}")
async def list_datasets(session_id: str):
    session = get_session(session_id)
    if not session:
        return JSONResponse(status_code=404, content={"error": "Session not found"})
    schemas = get_file_schemas(session_id)
    files = []
    for name, schema in schemas.items():
        files.append({"filename": name, **schema})
    return {"session_id": session_id, "files": files}


@router.delete("/datasets/{session_id}/{filename}")
async def remove_dataset(session_id: str, filename: str):
    success = delete_file(session_id, filename)
    if not success:
        return JSONResponse(status_code=404, content={"error": "File not found"})
    return {"status": "deleted", "filename": filename}
