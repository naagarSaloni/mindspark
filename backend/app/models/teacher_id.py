from sqlalchemy import Column, Integer, String
from app.core.database import Base

class TeacherID(Base):
    __tablename__ = "teacher_ids"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(String, unique=True, nullable=False)