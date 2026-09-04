import tempfile
from pathlib import Path

from app.ingestion.pdf_parser import extract_text_from_pdf
from app.llm.gemini_client import GeminiClient
from app.llm.prompt_builder import build_resume_analysis_prompt
from app.schemas.analysis import ResumeAnalysis


class AnalyzerService:

    def __init__(
            self,
            gemini_client:GeminiClient,
    ):
        self.gemini_client = gemini_client

    def analyze(
            self,
            resume_bytes:bytes,
            jd_bytes:bytes,
    )->ResumeAnalysis:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir = Path(temp_dir)

            resume_path = temp_dir/"resume.pdf"
            jd_path = temp_dir/ "jd.pdf"

            resume_path.write_bytes(resume_bytes)
            jd_path.write_bytes(jd_bytes)

            resume_text = extract_text_from_pdf(resume_path)
            jd_text = extract_text_from_pdf(jd_path)

            prompt = build_resume_analysis_prompt(
                resume_text=resume_text,
                jd_text= jd_text,
            )

            return self.gemini_client.analyze(prompt)