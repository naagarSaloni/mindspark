CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student')),
    unique_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(150) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    pdf_name VARCHAR(255),
    question_count INTEGER NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    exam_type VARCHAR(20) NOT NULL,
    timer_minutes INTEGER NOT NULL,
    token VARCHAR(20) UNIQUE NOT NULL,
    generated_questions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attempts (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id),
    student_id INTEGER NOT NULL REFERENCES users(id),
    submitted_answers TEXT,
    score INTEGER DEFAULT 0,
    ai_feedback TEXT,
    plagiarism_flag VARCHAR(20) DEFAULT 'low',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
