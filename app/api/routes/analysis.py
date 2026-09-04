from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import get_settings
from app.llm.gemini_client import GeminiClient
from app.schemas.analysis import ResumeAnalysis
from app.services.analyzer import AnalyzerService
import logging 
logger = logging.getLogger(__name__);


router = APIRouter(
    prefix="/api/v1",
    tags=["analysis"],
)

def get_analyzer_service()->AnalyzerService:
    settings = get_settings()

    gemini_client = GeminiClient(
        api_key=settings.gemini_api_key,
        model= settings.gemini_model,
    )

    return AnalyzerService(
        gemini_client=gemini_client,
    )

@router.post(
    "/analyze",
    response_model=ResumeAnalysis,
)
async def analyze_resume(
        resume:Annotated[
            UploadFile,
            File(description="Candidate Resume PDF")
        ],
        jd:Annotated[
            UploadFile,
            File(description="Job Description PDF"),
        ],
)->ResumeAnalysis:
    if resume.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Resume must be a PDF."
        )
    if jd.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Job Description must be a PDF."
        )

    try:
        resume_bytes = await resume.read()
        jd_bytes = await jd.read()

        if not resume_bytes:
            raise HTTPException(
                status_code=400,
                detail="Resume PDF is empty.",
            )

        if not jd_bytes:
            raise HTTPException(
                status_code=400,
                detail="Job description PDF is empty.",
            )

        settings = get_settings()
        max_size = (
            settings.max_file_size_mb*1024*1024
        )

        if len(resume_bytes)>max_size:
            raise HTTPException(
                status_code=413,
                detail="Resume file is too large.",
            )

        if len(jd_bytes) > max_size:
            raise HTTPException(
                status_code=413,
                detail="Job description file is too large.",
            )

        service = get_analyzer_service()

        return service.analyze(
            resume_bytes=resume_bytes,
            jd_bytes=jd_bytes,
        )
    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Resume analysis failed")
        raise HTTPException(
            status_code=500,
            detail="Resume analysis failed.",
        ) from exc