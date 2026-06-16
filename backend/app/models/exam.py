from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from app.core.database import Base

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(150), nullable=False)
    subject = Column(String(100), nullable=False)
    pdf_name = Column(String(255), nullable=True)
    question_count = Column(Integer, nullable=False)
    difficulty = Column(String(20), nullable=False)
    exam_type = Column(String(20), nullable=False)
    timer_minutes = Column(Integer, nullable=False)
    token = Column(String(20), unique=True, nullable=False, index=True)
    generated_questions = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    token_expiry_time = Column(DateTime(timezone=True), nullable=True)
