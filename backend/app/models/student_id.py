from sqlalchemy import Column, Integer, String
from app.core.database import Base

class StudentID(Base):
    __tablename__ = "student_ids"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, nullable=False)