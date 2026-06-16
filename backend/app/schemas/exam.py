from pydantic import BaseModel

class CreateExamRequest(BaseModel):
    title: str
    subject: str
    pdf_name: str | None = None
    question_count: int
    difficulty: str
    exam_type: str
    timer_minutes: int

class JoinExamRequest(BaseModel):
    token: str 