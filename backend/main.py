from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from api.routes_upload import router as upload_router
from api.routes_chat import router as chat_router
from api.routes_llm import router as llm_router
from api.routes_operations import router as ops_router
from api.routes_sessions import router as sessions_router
from api.routes_auth import router as auth_router
from services.database import init_db

app = FastAPI(
    title="BCN Multi-Agent Data Analytics",
    description="AI-powered chatbot for business data analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite database on startup
init_db()

app.include_router(upload_router, prefix="/api", tags=["files"])
app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(llm_router, prefix="/api", tags=["llm"])
app.include_router(ops_router, prefix="/api", tags=["data-operations"])
app.include_router(sessions_router, prefix="/api", tags=["sessions"])
app.include_router(auth_router, prefix="/api", tags=["auth"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
