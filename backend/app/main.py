from fastapi import FastAPI
from app.routers import auth
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine, SessionLocal
from app.routers import admin
# Import models so SQLAlchemy can create tables
from app.models.user import User
from app.models.exam import Exam
from app.models.attempt import Attempt

from app.routers import auth, exams, attempts
from app.core.security import hash_password
from app.models.user import User
from app.models.exam import Exam
from app.models.attempt import Attempt
from app.models.teacher_id import TeacherID
from app.models.student_id import StudentID
from app.routers import admin

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MindSpark API",
    version="1.0.0"
)

# CORS (FIXED CLEAN VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"]
)

app.include_router(
    exams.router,
    prefix="/api/exams",
    tags=["Exams"]
)

app.include_router(
    attempts.router,
    prefix="/api",
    tags=["Attempts"]
)
app.include_router(admin.router, prefix="/api/auth")
from app.routers import admin

app.include_router(
    admin.router,
    prefix="/api",
    tags=["Admin"]
)

# Root test route
@app.get("/")
def root():
    return {
        "message": "MindSpark Backend Running"
    }


@app.on_event("startup")
def create_admin_if_not_exists():
    db = SessionLocal()

    admin = db.query(User).filter(User.role == "admin").first()

    if not admin:
        db.add(User(
            full_name="System Admin",
            username="admin",
            email="mindspark.exam@gmail.com",
            password_hash=hash_password("Admin@123"),  # In a real application, ensure to hash the password
            role="admin",
            unique_id="ADMIN001"
        ))
        db.commit()

    db.close()