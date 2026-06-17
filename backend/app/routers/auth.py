import random
from datetime import datetime, timedelta

 
from app.services.email_service import send_otp_email
from fastapi import APIRouter, Depends, HTTPException
from app.models.user import User
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest
from fastapi import Depends, HTTPException
from app.core.security import get_current_user
from app.models.user import User
from app.models.teacher_id import TeacherID
from app.models.student_id import StudentID

def require_role(role: str):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != role:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action"
            )
        return current_user
    return role_checker
router = APIRouter()
otp_store = {}

@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(
        (User.username == payload.username) |
        (User.email == payload.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        )

    if payload.role not in ["teacher", "student"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    # -------------------------
    # VALIDATE ADMIN GENERATED IDS
    # -------------------------

    if payload.role == "teacher":

        valid_teacher = db.query(TeacherID).filter(
            TeacherID.teacher_id == payload.unique_id
        ).first()

        if not valid_teacher:
            raise HTTPException(
                status_code=400,
                detail="Teacher ID not authorized by admin"
            )

    elif payload.role == "student":

        valid_student = db.query(StudentID).filter(
            StudentID.student_id == payload.unique_id
        ).first()

        if not valid_student:
            raise HTTPException(
                status_code=400,
                detail="Student ID not authorized by admin"
            )

    # -------------------------
    # CHECK IF ID ALREADY USED
    # -------------------------

    used_id = db.query(User).filter(
        User.unique_id == payload.unique_id
    ).first()

    if used_id:
        raise HTTPException(
            status_code=400,
            detail="This ID has already been registered"
        )

    # -------------------------
    # CREATE USER
    # -------------------------

    user = User(
        full_name=payload.full_name,
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        unique_id=payload.unique_id,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Registration successful"
    }

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):

    print("LOGIN ATTEMPT:", payload.username)

    user = (
        db.query(User)
        .filter(
            (User.username == payload.username) |
            (User.email == payload.username)
        )
        .first()
    )

    print("USER FOUND:", user)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    token = create_access_token(
        {
            "sub": str(user.id),
            "role": user.role
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "unique_id": user.unique_id
        }
    }
@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "unique_id": current_user.unique_id,
    }
@router.post("/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(get_db)):

    email = payload.get("email")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Email not registered")

    otp = str(random.randint(100000, 999999))

    otp_store[email] = {
        "otp": otp,
        "expires": datetime.now() + timedelta(minutes=5)
    }

    # 🔥 SEND EMAIL HERE
    send_otp_email(email, otp)

    return {
        "message": "OTP sent to email"
    }
@router.post("/verify-otp")
def verify_otp(payload: dict):

    email = payload.get("email")
    otp = payload.get("otp")

    stored = otp_store.get(email)

    if not stored:
        raise HTTPException(
            status_code=400,
            detail="OTP not found"
        )

    if datetime.now() > stored["expires"]:
        raise HTTPException(
            status_code=400,
            detail="OTP expired"
        )

    if stored["otp"] != otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP"
        )

    return {
        "message": "OTP verified"
    }
@router.post("/reset-password")
def reset_password(
    payload: dict,
    db: Session = Depends(get_db)
):
    email = payload.get("email")
    password = payload.get("password")

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.password_hash = hash_password(password)

    db.commit()

    otp_store.pop(email, None)

    return {
        "message": "Password changed successfully"
    }
