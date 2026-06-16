from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    Float,
    func
)

from app.core.database import Base


class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)

    exam_id = Column(
        Integer,
        ForeignKey("exams.id"),
        nullable=False
    )

    student_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    submitted_answers = Column(
        Text,
        nullable=True
    )

    score = Column(
        Integer,
        nullable=False,
        default=0
    )

    percentage = Column(
        Float,
        nullable=False,
        default=0
    )

    ai_feedback = Column(
        Text,
        nullable=True
    )


    plagiarism_flag = Column(
        String(20),
        nullable=True,
        default="Low"
    )


    submitted_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )