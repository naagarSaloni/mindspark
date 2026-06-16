import json
import traceback
import tempfile
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.models.exam import Exam
from app.models.attempt import Attempt
from app.services.gemini_service import evaluate_answers
from fastapi.responses import FileResponse
from openpyxl import Workbook


router = APIRouter(
    prefix="/attempts",
    tags=["Attempts"]
)

@router.get("/teacher/tests")
def teacher_tests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher")),
):
    try:

        rows = (
            db.query(Attempt, Exam, User)
            .join(Exam, Attempt.exam_id == Exam.id)
            .join(User, Attempt.student_id == User.id)
            .filter(Exam.teacher_id == current_user.id)
            .all()
        )

        subjects = {}

        for attempt, exam, student in rows:

            subject_name = exam.subject or "Unknown Subject"

            if subject_name not in subjects:
                subjects[subject_name] = {
                    "subject": subject_name,
                    "topics": {}
                }

            topic_name = exam.title or "Untitled Test"

            if topic_name not in subjects[subject_name]["topics"]:
                subjects[subject_name]["topics"][topic_name] = {
                    "topic_name": topic_name,
                    "tests": []
                }

            try:
                student_answers = (
                    json.loads(attempt.submitted_answers)
                    if attempt.submitted_answers
                    else []
                )
            except Exception:
                student_answers = []

            try:
                evaluation = (
                    json.loads(attempt.ai_feedback)
                    if attempt.ai_feedback
                    else []
                )
            except Exception:
                evaluation = []

            merged_answers = []

            for i, ans in enumerate(student_answers):

                feedback = (
                    evaluation[i]
                    if i < len(evaluation)
                    else {}
                )

                merged_answers.append({
                    "question": feedback.get("question", ""),
                    "student_answer": ans.get("answer", ""),
                    "correct_answer": feedback.get("correct_answer", ""),
                    "feedback": feedback.get("feedback", ""),
                    "marks_obtained": feedback.get("marks_obtained", 0),
                    "manual_marks": feedback.get("manual_marks"),
                    "manual_evaluation": feedback.get(
                        "manual_evaluation",
                        False
                    )
                })

            subjects[subject_name]["topics"][topic_name]["tests"].append({
                "attempt_id": attempt.id,
                "student_name": student.full_name,
                "admission_no": student.unique_id,
                "score": attempt.score,
                "percentage": attempt.percentage,
                "plagiarism_flag": attempt.plagiarism_flag,
                "submitted_at": str(attempt.submitted_at),
                "answers": merged_answers
            })

        result = []

        for subject_data in subjects.values():

            subject_data["topics"] = list(
                subject_data["topics"].values()
            )

            result.append(subject_data)

        return result

    except Exception as e:
        import traceback

        print("\n" + "=" * 80)
        print("TEACHER TESTS ERROR")
        print("=" * 80)

        traceback.print_exc()

        print("=" * 80)
        print("ERROR:", str(e))
        print("=" * 80 + "\n")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.post("")
async def submit_attempt(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
):

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    exam_id = payload.get("exam_id")
    answers = payload.get("answers", [])

    if not exam_id:
        raise HTTPException(status_code=422, detail="exam_id missing")

    # ==========================
    # GET EXAM
    # ==========================
    exam = db.query(Exam).filter(Exam.id == int(exam_id)).first()

    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # ==========================
    # TOKEN EXPIRY CHECK
    # ==========================
    from datetime import datetime

    if exam.token_expiry_time and datetime.utcnow() > exam.token_expiry_time:
        raise HTTPException(
            status_code=403,
            detail="Token expired or invalid"
        )

    # ==========================
    # BLOCK RE-ATTEMPT
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
    # EVALUATION ENGINE
    # ==========================
    try:
        result = evaluate_answers(questions, answers)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation Error: {str(e)}"
        )

    details = result.get("details", [])

    # ==========================
    # PLAGIARISM
    # ==========================
    avg_plagiarism = (
        sum(item.get("plagiarism", 0) for item in details) / len(details)
        if details else 0
    )

    if avg_plagiarism >= 80:
        plagiarism_flag = "high"
    elif avg_plagiarism >= 50:
        plagiarism_flag = "medium"
    else:
        plagiarism_flag = "low"

    # ==========================
    # SAVE ATTEMPT
    # ==========================
    try:
        attempt = Attempt(
            exam_id=int(exam_id),
            student_id=current_user.id,
            submitted_answers=json.dumps(answers),
            score=result.get("score", 0),
            percentage=result.get("percentage", 0),
            ai_feedback=json.dumps(details),
            plagiarism_flag=plagiarism_flag,
        )

        db.add(attempt)
        db.commit()
        db.refresh(attempt)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database Error: {str(e)}"
        )

    # ==========================
    # RESPONSE (ONLY ONCE)
    # ==========================
    return {
        "attempt_id": attempt.id,
        "score": result.get("score", 0),
        "total": result.get("total", 0),
        "percentage": result.get("percentage", 0),
        "exam_type": exam.exam_type,
        "plagiarism_flag": plagiarism_flag,
        "feedback": details,
    }
# ==========================
# MANUAL EVALUATION
# ==========================

class ManualEvaluationRequest(BaseModel):
    attempt_id: int
    question_index: int
    marks: float


@router.post("/manual-evaluation")
def manual_evaluation(
    payload: ManualEvaluationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher")),
):

    attempt = (
        db.query(Attempt)
        .filter(Attempt.id == payload.attempt_id)
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="Attempt not found"
        )

    # -----------------------------
    # SAFE JSON PARSING
    # -----------------------------
    try:
        feedback = json.loads(attempt.ai_feedback) if attempt.ai_feedback else []
    except Exception:
        feedback = []

    # -----------------------------
    # VALIDATION
    # -----------------------------
    if not isinstance(feedback, list):
        feedback = []

    if payload.question_index < 0 or payload.question_index >= len(feedback):
        raise HTTPException(
            status_code=400,
            detail="Invalid question index"
        )

    # -----------------------------
    # UPDATE SINGLE QUESTION
    # -----------------------------
    feedback[payload.question_index]["manual_marks"] = float(payload.marks)
    feedback[payload.question_index]["manual_evaluation"] = True

    # -----------------------------
    # RECALCULATE SCORE
    # -----------------------------
    total_score = 0

    for item in feedback:
        if item.get("manual_evaluation"):
            total_score += float(item.get("manual_marks", 0))
        else:
            total_score += float(item.get("marks_obtained", 0))

    attempt.score = total_score
    attempt.ai_feedback = json.dumps(feedback)

    # -----------------------------
    # DB SAVE (FIXED SQLITE LOCK SAFE)
    # -----------------------------
    try:
        db.add(attempt)
        db.flush()      # IMPORTANT: reduces lock issues
        db.commit()
        db.refresh(attempt)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save manual evaluation: {str(e)}"
        )

    return {
        "message": "Manual evaluation saved",
        "new_score": total_score
    }
# ==========================
# STUDENT HISTORY
# ==========================
@router.get("/student-history")
def student_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
):

    rows = (
        db.query(Attempt, Exam)
        .join(Exam, Attempt.exam_id == Exam.id)
        .filter(Attempt.student_id == current_user.id)
        .order_by(Attempt.id.desc())
        .all()
    )

    return [
        {
            "attempt_id": attempt.id,
            "exam_title": exam.title,
            "score": attempt.score,
            "percentage": attempt.score,  # optional mapping
            "plagiarism_flag": attempt.plagiarism_flag,
            "submitted_at": attempt.submitted_at,
        }
        for attempt, exam in rows
    ]


# ==========================
# TEACHER HISTORY
# ==========================
@router.get("/teacher-history")
def teacher_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher")),
):

    rows = (
        db.query(Attempt, Exam)
        .join(Exam, Attempt.exam_id == Exam.id)
        .filter(Exam.teacher_id == current_user.id)
        .order_by(Attempt.id.desc())
        .all()
    )

    return [
        {
            "attempt_id": attempt.id,
            "exam_title": exam.title,
            "score": attempt.score,
            "plagiarism_flag": attempt.plagiarism_flag,
            "submitted_at": attempt.submitted_at,
        }
        for attempt, exam in rows
    ]

@router.get("/attempt/{attempt_id}/summary")
def attempt_summary(attempt_id: int, db: Session = Depends(get_db)):

    attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    feedback = json.loads(attempt.ai_feedback or "[]")

    total_marks = 0
    obtained_marks = 0

    strengths = []
    weaknesses = []
    exam = db.query(Exam).filter(Exam.id == attempt.exam_id).first()
    for f in feedback:

        marks = float(f.get("marks_obtained", 0))

        max_marks = float(
            f.get("max_marks",
                  1 if f.get("type") == "mcq" else 5)
        )

        total_marks += max_marks
        obtained_marks += marks

        topic = exam.subject if exam and exam.subject else "General"

        if marks >= (max_marks * 0.6):
            strengths.append(topic)
        else:
            weaknesses.append(topic)

    percentage = round(
        (obtained_marks / total_marks) * 100,
        2
    ) if total_marks else 0

    return {
        "score": round(obtained_marks, 2),
        "total": round(total_marks, 2),
        "percentage": percentage,
        "strengths": list(set(strengths)),
        "weaknesses": list(set(weaknesses))
    }


 
@router.get("/export/excel")
def export_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher")),
):
    rows = (
        db.query(Attempt, Exam, User)
        .join(Exam, Attempt.exam_id == Exam.id)
        .join(User, Attempt.student_id == User.id)
        .filter(Exam.teacher_id == current_user.id)
        .all()
    )

    wb = Workbook()
    ws = wb.active
    ws.title = "Results"

    ws.append([
        "Student Name",
        "Admission No",
        "Exam Title",
        "Subject",
        "Score",
        "Percentage",
        "Plagiarism",
        "Submitted At"
    ])

    for attempt, exam, student in rows:
        ws.append([
            student.full_name,
            student.unique_id,
            exam.title,
            exam.subject,
            attempt.score,
            attempt.percentage,
            attempt.plagiarism_flag,
            str(attempt.submitted_at)
        ])

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".xlsx"
    )

    wb.save(temp_file.name)

    return FileResponse(
        path=temp_file.name,
        filename="MindSpark_Report.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )