# MindSpark: AI-Powered Examination & Assessment Platform

An AI-powered online examination platform designed for educational institutions. MindSpark enables teachers to create intelligent assessments, evaluate subjective answers using AI, detect plagiarism, monitor suspicious activity during tests, and generate detailed performance analytics.

## Live Demo

**Website:**  https://mindspark-pi-ten.vercel.app

**Backend API:**  https://mindspark-backend-264v.onrender.com/api

**Demo PDF** https://your-demo-video-link

## GitHub Repository

https://github.com/naagarSaloni/mindspark
---

## Overview

MindSpark is a full-stack web application that automates the assessment process for educational institutions.

The platform allows teachers to generate tests using AI, conduct online examinations, evaluate subjective answers automatically, track student performance, and generate detailed reports.

Students can securely join tests using unique access tokens, attempt examinations, receive AI-generated feedback, and track their academic progress.

---

## Key Features

### Authentication & User Management

* Role-based authentication
* Admin, Teacher, and Student portals
* Secure JWT authentication
* Password hashing using bcrypt
* Forgot Password with Email OTP verification
* Authorized registration using pre-approved Teacher IDs and Student IDs

### Teacher Features

* Create AI-generated tests
* Create manual tests
* Configure subject, topic, difficulty level, and question count
* Set examination duration
* Review student submissions
* AI-powered answer evaluation
* Manual score override
* Export PDF and Excel reports

### Student Features

* Secure login system
* Join tests using unique access tokens
* Attempt subjective examinations
* Access AI-generated feedback
* View performance history
* Track previous attempts and scores

### AI Features

* AI Question Generation
* AI Subjective Answer Evaluation
* Personalized Feedback Generation
* Topic-wise Performance Analysis
* Automated Scoring System

### Anti-Cheating System

* Tab-switch detection
* Multiple warning system
* Automatic submission after exceeding warning limits
* Attempt monitoring

### Plagiarism Detection

* Similarity analysis
* Plagiarism percentage calculation
* Integrity reports for teachers

### Analytics Dashboard

* Student performance trends
* Top performers leaderboard
* Score distribution graphs
* Subject-wise analysis
* Topic-wise performance tracking

### Reports

* Excel Export

## Local Setup

### Clone Repository

```bash
git clone https://github.com/naagarSaloni/mindspark
```

### Backend Setup

```bash
cd backend

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend will run on:

```text
https://mindspark-backend-264v.onrender.com
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend will run on:

```text
http://127.0.0.1:5173
```

### Environment Variables

Create a `.env` file inside the backend folder.

```env
SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///./mindspark.db
GEMINI_API_KEY=your_gemini_api_key
```
