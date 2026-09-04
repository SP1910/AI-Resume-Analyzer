from google import genai
from google.genai import types

from app.schemas.analysis import ResumeAnalysis

class GeminiClient:
    def __init__(self, api_key:str, model:str):
        self.model = model
        self.client = genai.Client(
            api_key=api_key
        )

    def analyze(
            self,
            prompt: str,
    )->ResumeAnalysis:
        response = self.client.models.generate_content(
            model = self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ResumeAnalysis,
            ),
        )
        if not response.text:
            raise RuntimeError(
                "Gemini returned an empty response."
            )

        return ResumeAnalysis.model_validate_json(
            response.text
        )