from fastapi import APIRouter, Depends, HTTPException, status

from src.api.deps import get_current_user
from src.models.schemas import JobOut, ReportOut
from src.db.queries import list_jobs, get_job, get_report

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("", response_model=list[JobOut])
async def list_my_jobs(
    limit: int = 20,
    user_id: str = Depends(get_current_user),
):
    """Return the authenticated user's research jobs, newest first."""
    jobs = await list_jobs(user_id=user_id, limit=limit)
    return jobs


@router.get("/{job_id}", response_model=JobOut)
async def get_job_status(
    job_id: str,
    user_id: str = Depends(get_current_user),
):
    """
    Get the status of a single job.
    Returns 404 if the job does not exist or does not belong to the user.
    """
    job = await get_job(job_id=job_id, user_id=user_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    return job


@router.get("/{job_id}/report", response_model=ReportOut)
async def get_job_report(
    job_id: str,
    user_id: str = Depends(get_current_user),
):
    """
    Get the final report for a completed job, including its sources.
    Returns 404 if the report is not ready or does not belong to the user.
    """
    report = await get_report(job_id=job_id, user_id=user_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found — the job may still be running",
        )
    return report
