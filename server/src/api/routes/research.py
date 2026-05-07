import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from src.api.deps import get_current_user
from src.models.schemas import ResearchRequest
from src.db.queries import create_job, update_job_status
from src.graph.graph import run_research

router = APIRouter(prefix="/api/research", tags=["research"])


@router.post("")
async def start_research(
    body: ResearchRequest,
    user_id: str = Depends(get_current_user),
):
    """
    Create a research job and stream progress events via SSE.

    The response is a text/event-stream that emits JSON-encoded StreamEvent
    objects as the LangGraph pipeline progresses through its nodes.

    Event types:
      - status      : progress update message
      - source      : a new source was discovered
      - finding     : a relevant finding was extracted
      - section_done: a report section was completed
      - error       : a non-fatal error occurred
      - done        : pipeline finished, job_id included in data
    """
    # 1. Persist the job so the client can reference it later
    job = await create_job(
        user_id=user_id,
        query=body.query,
        depth=body.depth,
    )
    job_id = job["id"]

    # 2. Mark the job as running
    await update_job_status(job_id, "running")

    async def event_stream():
        # Emit the job_id immediately so the client can start polling
        yield f"data: {json.dumps({'type': 'job_created', 'message': 'Job created', 'data': {'job_id': job_id}})}\n\n"

        try:
            async for event in run_research(
                job_id=job_id,
                user_id=user_id,
                query=body.query,
                depth=body.depth,
            ):
                yield f"data: {json.dumps(event)}\n\n"
                # Small sleep to allow the event loop to flush the response buffer
                await asyncio.sleep(0)

        except Exception as exc:
            error_payload = json.dumps({
                "type": "error",
                "message": f"Pipeline error: {str(exc)}",
                "data": {"job_id": job_id},
            })
            yield f"data: {error_payload}\n\n"
            await update_job_status(job_id, "failed", error_message=str(exc))

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disable nginx buffering if behind proxy
        },
    )
