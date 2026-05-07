from langgraph.graph import StateGraph, END
from src.graph.state import ResearchState
from src.agents.supervisor import supervisor_agent
from src.agents.researcher import researcher_agent
from src.agents.scraper import scraper_agent
from src.agents.writer import writer_agent
from src.db.queries import update_job_status, save_report, save_sources
import asyncio


# ---------------------------------------------------------------------------
# Conditional edge — should we loop back or hand off to the writer?
# ---------------------------------------------------------------------------

def should_continue_research(state: ResearchState) -> str:
    """
    Called after every scraper pass.
    Returns the name of the next node.
    """
    if state.get("error"):
        return "writer"     # fail gracefully — write with what we have

    if not state.get("should_continue", True):
        return "writer"

    if state["iterations"] >= state["max_iterations"]:
        return "writer"

    # Not enough findings yet — loop back to researcher
    min_findings = {"quick": 3, "deep": 6, "exhaustive": 10}
    target = min_findings.get(state["depth"], 6)
    if len(state["findings"]) < target:
        return "researcher"

    return "writer"


# ---------------------------------------------------------------------------
# DB sync wrappers — persist state to Supabase after key transitions
# ---------------------------------------------------------------------------

async def sync_to_db(state: ResearchState) -> ResearchState:
    """
    Runs after the writer finishes.
    Saves report + sources to Supabase and marks the job done.
    """
    try:
        await save_report(
            job_id=state["job_id"],
            user_id=state["user_id"],
            title=state["report_title"],
            content=state["report_content"],
            summary=state["report_summary"],
            word_count=len(state["report_content"].split()),
        )
        await save_sources(
            job_id=state["job_id"],
            sources=state["sources"],
        )
        await update_job_status(
            job_id=state["job_id"],
            status="done",
        )
    except Exception as e:
        await update_job_status(
            job_id=state["job_id"],
            status="failed",
            error_message=str(e),
        )
        return {**state, "error": str(e), "status": "failed"}

    return {**state, "status": "done"}


# ---------------------------------------------------------------------------
# Build the graph
# ---------------------------------------------------------------------------

def build_research_graph() -> StateGraph:
    graph = StateGraph(ResearchState)

    # Register nodes
    graph.add_node("supervisor",  supervisor_agent)
    graph.add_node("researcher",  researcher_agent)
    graph.add_node("scraper",     scraper_agent)
    graph.add_node("writer",      writer_agent)
    graph.add_node("sync_db",     sync_to_db)

    # Entry point
    graph.set_entry_point("supervisor")

    # Linear: supervisor → researcher → scraper
    graph.add_edge("supervisor", "researcher")
    graph.add_edge("researcher", "scraper")

    # Conditional: after scraper, loop or proceed to writer
    graph.add_conditional_edges(
        "scraper",
        should_continue_research,
        {
            "researcher": "researcher",
            "writer":     "writer",
        }
    )

    # Linear: writer → sync_db → END
    graph.add_edge("writer",   "sync_db")
    graph.add_edge("sync_db",  END)

    return graph.compile()


# ---------------------------------------------------------------------------
# Public runner — used by FastAPI's SSE endpoint
# ---------------------------------------------------------------------------

research_graph = build_research_graph()


async def run_research(
    job_id: str,
    user_id: str,
    query: str,
    depth: str = "deep",
):
    """
    Async generator. Yields StreamEvent dicts as they are produced.
    FastAPI's SSE route iterates this and flushes each event to the client.

    Usage:
        async for event in run_research(job_id, user_id, query):
            yield f"data: {json.dumps(event)}\\n\\n"
    """
    depth_to_iters = {"quick": 1, "deep": 2, "exhaustive": 4}

    initial_state: ResearchState = {
        "job_id":          job_id,
        "user_id":         user_id,
        "query":           query,
        "depth":           depth,
        "sub_questions":   [],
        "findings":        [],
        "sources":         [],
        "report_title":    "",
        "report_content":  "",
        "report_summary":  "",
        "status":          "pending",
        "iterations":      0,
        "max_iterations":  depth_to_iters.get(depth, 2),
        "should_continue": True,
        "events":          [],
        "error":           None,
        "failed_urls":     [],
    }

    # Stream graph execution — LangGraph yields state snapshots after each node
    async for snapshot in research_graph.astream(initial_state):
        # Each snapshot is {node_name: updated_state}
        for node_name, state in snapshot.items():
            # Flush any events the agent appended to state["events"]
            for event in state.get("events", []):
                yield event

            # Clear flushed events so they don't repeat in the next snapshot
            # (agents should reset events=[] before appending new ones)

    # Final done event
    yield {"type": "done", "message": "Research complete", "data": {"job_id": job_id}}
