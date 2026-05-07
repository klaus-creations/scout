from typing import TypedDict, Optional, Literal
from datetime import datetime


class SourceItem(TypedDict):
    url: str
    title: str
    excerpt: str
    agent: str          # "researcher" | "scraper"
    fetched_at: str     # ISO string


class FindingItem(TypedDict):
    sub_question: str
    content: str
    source_url: str
    relevance_score: float


class StreamEvent(TypedDict):
    type: Literal["status", "source", "finding", "token", "section_done", "error", "done"]
    message: str
    data: Optional[dict]


class ResearchState(TypedDict):
    # Identity — set once at job creation, never mutated
    job_id: str
    user_id: str

    # Input
    query: str
    depth: Literal["quick", "deep", "exhaustive"]   # controls iteration budget

    # Supervisor output
    sub_questions: list[str]

    # Accumulated across agent loops
    findings: list[FindingItem]
    sources: list[SourceItem]

    # Writer output
    report_title: str
    report_content: str         # full markdown
    report_summary: str         # 2-3 sentence abstract

    # Control flow
    status: Literal["pending", "decomposing", "searching", "scraping", "writing", "done", "failed"]
    iterations: int             # how many researcher→scraper loops have run
    max_iterations: int         # set from depth: quick=1, deep=2, exhaustive=4
    should_continue: bool       # conditional edge reads this

    # Streaming — list of events to flush to SSE
    events: list[StreamEvent]

    # Error tracking
    error: Optional[str]
    failed_urls: list[str]      # scrapes that 403'd / timed out
