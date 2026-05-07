from src.db.client import get_supabase_admin
from src.graph.state import SourceItem
from datetime import datetime, timezone
from typing import Optional
import uuid


def _admin():
    return get_supabase_admin()


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------

async def create_job(
    user_id: str,
    query: str,
    depth: str = "deep",
) -> dict:
    job_id = str(uuid.uuid4())
    data = {
        "id":         job_id,
        "user_id":    user_id,
        "query":      query,
        "depth":      depth,
        "status":     "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = _admin().table("research_jobs").insert(data).execute()
    return result.data[0]


async def update_job_status(
    job_id: str,
    status: str,
    error_message: Optional[str] = None,
) -> None:
    update: dict = {"status": status}

    if status == "running":
        update["started_at"] = datetime.now(timezone.utc).isoformat()
    if status in ("done", "failed"):
        update["completed_at"] = datetime.now(timezone.utc).isoformat()
    if error_message:
        update["error_message"] = error_message

    _admin().table("research_jobs").update(update).eq("id", job_id).execute()


async def get_job(job_id: str, user_id: str) -> Optional[dict]:
    result = (
        _admin()
        .table("research_jobs")
        .select("*")
        .eq("id", job_id)
        .eq("user_id", user_id)   # ensure ownership
        .single()
        .execute()
    )
    return result.data


async def list_jobs(user_id: str, limit: int = 20) -> list[dict]:
    result = (
        _admin()
        .table("research_jobs")
        .select("id, query, status, depth, created_at, completed_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

async def save_report(
    job_id: str,
    user_id: str,
    title: str,
    content: str,
    summary: str,
    word_count: int,
) -> dict:
    data = {
        "id":         str(uuid.uuid4()),
        "job_id":     job_id,
        "user_id":    user_id,
        "title":      title,
        "content":    content,
        "summary":    summary,
        "word_count": word_count,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = _admin().table("reports").insert(data).execute()
    return result.data[0]


async def get_report(job_id: str, user_id: str) -> Optional[dict]:
    # 1. Fetch the report
    report_res = (
        _admin()
        .table("reports")
        .select("*")
        .eq("job_id", job_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    report = report_res.data
    if not report:
        return None
    
    # 2. Fetch the sources for this job
    sources_res = (
        _admin()
        .table("sources")
        .select("*")
        .eq("job_id", job_id)
        .order("fetched_at", desc=False)
        .execute()
    )
    
    # 3. Combine them
    report["sources"] = sources_res.data
    return report



# ---------------------------------------------------------------------------
# Sources
# ---------------------------------------------------------------------------

async def save_sources(job_id: str, sources: list[SourceItem]) -> None:
    if not sources:
        return

    rows = [
        {
            "id":         str(uuid.uuid4()),
            "job_id":     job_id,
            "url":        s["url"],
            "title":      s.get("title", ""),
            "excerpt":    s.get("excerpt", "")[:500],
            "agent":      s.get("agent", "researcher"),
            "fetched_at": s.get("fetched_at", datetime.now(timezone.utc).isoformat()),
        }
        for s in sources
        if s.get("url")          # skip anything without a URL
    ]

    # Batch insert — Supabase handles up to 1000 rows per call
    _admin().table("sources").insert(rows).execute()


# ---------------------------------------------------------------------------
# Usage events
# ---------------------------------------------------------------------------

async def log_usage_event(
    user_id: str,
    event_type: str,
    metadata: Optional[dict] = None,
) -> None:
    data = {
        "id":         str(uuid.uuid4()),
        "user_id":    user_id,
        "event_type": event_type,
        "metadata":   metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _admin().table("usage_events").insert(data).execute()
