import re
from pathlib import Path

import fitz

class PDFExtractionError(Exception):
    """raised when pdf cannot be read"""

def clean_text(text:str)->str:
    text = text.replace("\x00", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def extract_text_from_pdf(file_path: str | Path) -> str:
    file_path = Path(file_path)

    if not file_path.exists():
        raise PDFExtractionError(
            f"PDF file does not exist: {file_path}"
        )

    try:
        document=fitz.open(file_path)
        pages = []

        for page in document:
            pages.append(page.get_text())
        document.close()

    except Exception as exc:
        raise PDFExtractionError(
            """Unable to open or parse PDF File."""
        ) from exc

    text = clean_text("\n".join(pages))

    if not text:
        raise PDFExtractionError(
            "No extractable text found in PDF. "
            "The PDF may be scanned or image-based."
        )

    return text