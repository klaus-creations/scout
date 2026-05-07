from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from src.api.routes import research, jobs

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: pre-build the LangGraph so the first request isn't slow
    from src.graph.graph import research_graph  # noqa: F401
    yield
    # Shutdown: nothing to clean up for now


def create_app() -> FastAPI:
    app = FastAPI(
        title="Scout AI — Research API",
        description="Multi-agent AI research pipeline powered by LangGraph and Gemini.",
        version="0.1.0",
        lifespan=lifespan,
    )

    # --- CORS ---
    allowed_origins = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000",
    ).split(",")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in allowed_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Routers ---
    app.include_router(research.router)
    app.include_router(jobs.router)

    # --- Health check ---
    @app.get("/health", tags=["health"])
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
