from pydantic import BaseModel, Field

class ResumeAnalysis(BaseModel):
    match_score:int = Field(
        ge=0,
        le=100,
    )

    strengths: list[str]
    missing_skills: list[str]
    relavent_experience: list[str]
    improvement_areas: list[str]
    recommendations: list[str]
    interview_questions: list[str]
