from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

class ResearchRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=2000, description="The research query")
    depth: Literal["quick", "deep", "exhaustive"] = Field(
        default="deep",
        description="Research depth: quick (fast), deep (balanced), exhaustive (thorough)",
    )


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class JobOut(BaseModel):
    id: str
    query: str
    status: str
    depth: str
    created_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None


class SourceOut(BaseModel):
    id: str
    url: str
    title: Optional[str] = None
    excerpt: Optional[str] = None
    agent: str
    fetched_at: Optional[str] = None


class ReportOut(BaseModel):
    id: str
    job_id: str
    title: str
    content: str
    summary: str
    word_count: int
    created_at: str
    sources: list[SourceOut] = []


class ErrorResponse(BaseModel):
    detail: str
