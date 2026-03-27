from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from api.routes_upload import router as upload_router
from api.routes_chat import router as chat_router

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

app.include_router(upload_router, prefix="/api", tags=["files"])
app.include_router(chat_router, prefix="/api", tags=["chat"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
