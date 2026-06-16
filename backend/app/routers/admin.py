from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.teacher_id import TeacherID
from app.models.student_id import StudentID

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.delete("/delete-user/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(404, "User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted"}


@router.put("/block/{user_id}")
def block_user(user_id: int, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == user_id).first()
    user.is_blocked = True
    db.commit()

    return {"message": "User blocked"}


@router.put("/unblock/{user_id}")
def unblock_user(user_id: int, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == user_id).first()
    user.is_blocked = False
    db.commit()

    return {"message": "User unblocked"}

# ==========================
# TEACHER IDS
# ==========================

@router.get("/teacher-ids")
def get_teacher_ids(db: Session = Depends(get_db)):
    return db.query(TeacherID).all()


@router.post("/teacher-ids/{teacher_id}")
def add_teacher_id(teacher_id: str, db: Session = Depends(get_db)):

    exists = db.query(TeacherID).filter(
        TeacherID.teacher_id == teacher_id
    ).first()

    if exists:
        raise HTTPException(400, "Teacher ID already exists")

    db.add(TeacherID(teacher_id=teacher_id))
    db.commit()

    return {"message": "Teacher ID added"}


@router.delete("/teacher-ids/{id}")
def delete_teacher_id(id: int, db: Session = Depends(get_db)):

    item = db.query(TeacherID).filter(
        TeacherID.id == id
    ).first()

    if not item:
        raise HTTPException(404, "Teacher ID not found")

    db.delete(item)
    db.commit()

    return {"message": "Teacher ID deleted"}


# ==========================
# STUDENT IDS
# ==========================

@router.get("/student-ids")
def get_student_ids(db: Session = Depends(get_db)):
    return db.query(StudentID).all()


@router.post("/student-ids/{admission_no}")
def add_student_id(admission_no: str, db: Session = Depends(get_db)):

    exists = db.query(StudentID).filter(
        StudentID.admission_no == admission_no
    ).first()

    if exists:
        raise HTTPException(400, "Admission number already exists")

    db.add(StudentID(admission_no=admission_no))
    db.commit()

    return {"message": "Student ID added"}


@router.delete("/student-ids/{id}")
def delete_student_id(id: int, db: Session = Depends(get_db)):

    item = db.query(StudentID).filter(
        StudentID.id == id
    ).first()

    if not item:
        raise HTTPException(404, "Admission number not found")

    db.delete(item)
    db.commit()

    return {"message": "Student ID deleted"}