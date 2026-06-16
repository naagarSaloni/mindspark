from pydantic import BaseModel
from typing import Any, List, Dict


class SubmitAttemptRequest(BaseModel):
    exam_id: int
    answers: List[Dict[str, Any]]

    class Config:
        extra = "allow"