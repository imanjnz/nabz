from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.ai import router as ai_router
from app.exam import router as exam_router

app = FastAPI(
    title="NABZ API",
    description="The Pulse of Learning",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("NABZ_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exam_router)
app.include_router(ai_router)


@app.get("/")
def root():
    return {
        "name": "NABZ",
        "message": "The Pulse of Learning",
        "status": "running",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "NABZ Backend",
        "version": "0.2.0",
    }
