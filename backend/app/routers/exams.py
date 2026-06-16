import os
import json
import random
import string

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.routers.auth import require_role
from app.core.database import get_db
 
from app.models import Exam, User,Attempt
from app.services.gemini_service import generate_questions_from_pdf

router = APIRouter(tags=["Exams"])


# =========================
# TOKEN GENERATOR
# =========================
def generate_token(length: int = 6) -> str:
    return ''.join(
        random.choices(string.ascii_uppercase + string.digits, k=length)
    )


# =========================
# VALIDATION HELPER
# =========================
def validate_exam_type(exam_type: str):

    exam_type = exam_type.lower().strip()

    allowed = ["mcq", "subjective", "mixed"]

    if exam_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail="exam_type must be 'mcq', 'subjective' or 'mixed'"
        )

    return exam_type


# =========================
# CREATE EXAM (TEACHER)
# =========================
from datetime import datetime, timedelta

@router.post("")
async def create_exam(
    title: str = Form(...),
    subject: str = Form(...),
    question_count: int = Form(...),
    difficulty: str = Form(...),
    exam_type: str = Form(...),
    timer_minutes: int = Form(...),
    token_valid_minutes: int = Form(30),  # ✅ NEW (teacher can set expiry)
    pdf: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher")),
):
    try:
        # Validate exam type
        exam_type = validate_exam_type(exam_type)

        is_subjective = (exam_type == "subjective")

        # Generate student token
        token = generate_token()

        # ==========================
        # 🚨 NEW: TOKEN EXPIRY TIME
        # ==========================
        expiry_time = datetime.utcnow() + timedelta(minutes=token_valid_minutes)

        # Save uploaded PDF
        os.makedirs("uploads", exist_ok=True)
        file_path = os.path.join("uploads", pdf.filename)

        content = await pdf.read()

        with open(file_path, "wb") as f:
            f.write(content)

        # Generate questions using Gemini
        generated_data = generate_questions_from_pdf(
            pdf_path=file_path,
            question_count=question_count,
            difficulty=difficulty,
            exam_type=exam_type,
        )

        questions = generated_data.get("questions", [])

        if not questions:
            raise HTTPException(
                status_code=400,
                detail="No questions were generated."
            )

        # Subjective validation
        if is_subjective:
            for q in questions:
                if "options" in q:
                    raise HTTPException(
                        status_code=500,
                        detail="MCQ detected in subjective mode."
                    )

        # ==========================
        # SAVE EXAM
        # ==========================
        exam = Exam(
            teacher_id=current_user.id,
            title=title,
            subject=subject,
            pdf_name=pdf.filename,
            question_count=question_count,
            difficulty=difficulty,
            exam_type=exam_type,
            timer_minutes=timer_minutes,
            token=token,
            generated_questions=json.dumps(questions),

            # ✅ NEW FIELD
            token_expiry_time=expiry_time,
        )

        db.add(exam)
        db.commit()
        db.refresh(exam)

        return {
            "message": "Exam created successfully",
            "exam_id": exam.id,
            "token": exam.token,
            "title": exam.title,
            "subject": exam.subject,
            "question_count": exam.question_count,
            "difficulty": exam.difficulty,
            "exam_type": exam.exam_type,
            "timer_minutes": exam.timer_minutes,
            "token_valid_minutes": token_valid_minutes,
            "token_expiry_time": str(expiry_time),  # optional but useful
            "questions": questions,
        }

    except HTTPException:
        raise

    except Exception as e:
        import traceback
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"Unexpected server error: {str(e)}"
        )
# =========================
# JOIN EXAM (STUDENT)
# =========================
class JoinRequest(BaseModel):
    token: str

from datetime import datetime

@router.post("/join")
async def join_exam(
    payload: JoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
):

    # ==========================
    # GET EXAM BY TOKEN
    # ==========================
    exam = db.query(Exam).filter(Exam.token == payload.token).first()

    # ==========================
    # INVALID TOKEN CHECK
    # ==========================
    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Invalid or expired token"
        )

    # ==========================
    # TOKEN EXPIRY CHECK
    # ==========================
    from datetime import datetime

    if exam.token_expiry_time and datetime.utcnow() > exam.token_expiry_time:
        raise HTTPException(
            status_code=403,
            detail="Token expired. Please contact teacher."
        )

    # ==========================
    # 🚨 BLOCK RE-ATTEMPT (IMPORTANT FIX)
    # ==========================
    existing_attempt = db.query(Attempt).filter(
        Attempt.exam_id == exam.id,
        Attempt.student_id == current_user.id
    ).first()

    if existing_attempt:
        raise HTTPException(
            status_code=403,
            detail="You have already attempted this exam"
        )

    # ==========================
    # LOAD QUESTIONS
    # ==========================
    try:
        questions = json.loads(exam.generated_questions) if exam.generated_questions else []
    except Exception:
        questions = []

    # ==========================
    # RESPONSE
    # ==========================
    return {
        "exam_id": exam.id,
        "title": exam.title,
        "subject": exam.subject,
        "exam_type": exam.exam_type,
        "timer_minutes": exam.timer_minutes,
        "questions": questions,
    }


# =========================
# GET TEACHER EXAMS
# =========================
@router.get("")
async def get_teacher_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher")),
):

    exams = db.query(Exam).filter(Exam.teacher_id == current_user.id).all()

    return [
        {
            "id": exam.id,
            "title": exam.title,
            "subject": exam.subject,
            "token": exam.token,
            "question_count": exam.question_count,
            "difficulty": exam.difficulty,
            "exam_type": exam.exam_type,
            "timer_minutes": exam.timer_minutes,
            "created_at": str(exam.created_at) if exam.created_at else None,
        }
        for exam in exams
    ]


# =========================
# GET EXAM BY ID
# =========================
@router.get("/{exam_id}")
async def get_exam_by_id(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher")),
):

    exam = db.query(Exam).filter(Exam.id == exam_id).first()

    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    try:
        questions = json.loads(exam.generated_questions) if exam.generated_questions else []
    except Exception:
        questions = []

    return {
        "id": exam.id,
        "title": exam.title,
        "subject": exam.subject,
        "token": exam.token,
        "question_count": exam.question_count,
        "difficulty": exam.difficulty,
        "exam_type": exam.exam_type,
        "timer_minutes": exam.timer_minutes,
        "questions": questions,
        "created_at": str(exam.created_at) if exam.created_at else None,
    }