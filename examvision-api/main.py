from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import json

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import (
    User,
    Exam,
    Question,
    Answer,
    ExamAttempt,
    StudentAnswer,
    MonitoringLog,
    MonitoringReport,
)


app = FastAPI(title="ExamVision API - Sprint5/Sprint6")

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Demo/Sprint хувилбар дээр OK
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SECRET_KEY = "examvision_super_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================
# Request Schemas
# =========================

class RegisterReq(BaseModel):
    first_name: str
    last_name: str
    identifier: str
    password: str
    role: str = "student"


class LoginReq(BaseModel):
    identifier: str
    password: str


class ForgotReq(BaseModel):
    identifier: str


class FaceVerifyReq(BaseModel):
    image: str


class StartExamReq(BaseModel):
    exam_id: int


class SubmitExamReq(BaseModel):
    exam_id: int
    answers: Dict[str, str]


class MonitoringLogReq(BaseModel):
    exam_id: int
    event_type: str
    details: Dict[str, Any] = Field(default_factory=dict)


class AIDetectReq(BaseModel):
    exam_id: int
    image: Optional[str] = None
    demo_object: Optional[str] = None


# =========================
# Seed Demo Data
# =========================

def seed_demo_data(db: Session):
    student = db.query(User).filter(User.identifier == "student@example.com").first()
    teacher = db.query(User).filter(User.identifier == "teacher@example.com").first()
    admin = db.query(User).filter(User.identifier == "admin@example.com").first()

    demo_users = []

    if not student:
        demo_users.append(
            User(
                identifier="student@example.com",
                password="demo123",
                role="student",
                first_name="Student",
                last_name="User",
            )
        )

    if not teacher:
        demo_users.append(
            User(
                identifier="teacher@example.com",
                password="demo123",
                role="teacher",
                first_name="Teacher",
                last_name="User",
            )
        )

    if not admin:
        demo_users.append(
            User(
                identifier="admin@example.com",
                password="demo123",
                role="admin",
                first_name="Admin",
                last_name="User",
            )
        )

    if demo_users:
        db.add_all(demo_users)
        db.commit()

    existing_exam = db.query(Exam).filter(Exam.title == "Web Engineering Midterm").first()
    if existing_exam:
        return

    exam = Exam(
        title="Web Engineering Midterm",
        description="React, API, Authentication, Monitoring суурь ойлголтын шалгалт",
        duration_minutes=10,
        status="published",
    )

    db.add(exam)
    db.commit()
    db.refresh(exam)

    questions = [
        {
            "text": "React нь ямар төрлийн library вэ?",
            "correct": "b",
            "options": [
                ("a", "Database library"),
                ("b", "UI library"),
                ("c", "Operating system"),
                ("d", "Network protocol"),
            ],
        },
        {
            "text": "JWT юунд ашиглагддаг вэ?",
            "correct": "a",
            "options": [
                ("a", "Authentication token"),
                ("b", "CSS framework"),
                ("c", "Database engine"),
                ("d", "Image format"),
            ],
        },
        {
            "text": "FastAPI ямар програмчлалын хэл дээр суурилдаг вэ?",
            "correct": "b",
            "options": [
                ("a", "Java"),
                ("b", "Python"),
                ("c", "PHP"),
                ("d", "C#"),
            ],
        },
        {
            "text": "Онлайн шалгалтын үед tab солихыг ямар event-ээр бүртгэж болох вэ?",
            "correct": "c",
            "options": [
                ("a", "onclick"),
                ("b", "onload"),
                ("c", "visibilitychange"),
                ("d", "onhover"),
            ],
        },
    ]

    for item in questions:
        question = Question(
            exam_id=exam.id,
            text=item["text"],
            type="single",
            points=2,
            correct_answer=item["correct"],
        )

        db.add(question)
        db.commit()
        db.refresh(question)

        for option_key, option_text in item["options"]:
            answer = Answer(
                question_id=question.id,
                option_key=option_key,
                text=option_text,
            )
            db.add(answer)

    db.commit()


@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        seed_demo_data(db)
    finally:
        db.close()


# =========================
# Auth Helpers
# =========================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_token_from_header(authorization: Optional[str] = Header(default=None)):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header байхгүй байна.",
        )

    parts = authorization.split(" ")

    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Authorization header буруу байна.",
        )

    return parts[1]


def get_current_user(
    token: str = Depends(get_token_from_header),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        identifier = payload.get("sub")

        if not identifier:
            raise HTTPException(
                status_code=401,
                detail="Token payload буруу байна.",
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token хүчингүй байна.",
        )

    user = db.query(User).filter(User.identifier == identifier).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Хэрэглэгч олдсонгүй.",
        )

    return user


# =========================
# Risk / Report Helpers
# =========================

def get_event_risk_level(event_type: str):
    high_events = [
        "phone_detected",
        "person_detected",
    ]

    medium_events = [
        "book_detected",
        "laptop_detected",
        "tab_switch",
        "fullscreen_exit",
        "copy_attempt",
        "paste_attempt",
        "right_click",
    ]

    if event_type in high_events:
        return "high"

    if event_type in medium_events:
        return "medium"

    return "low"


def calculate_report_risk_level(logs):
    high_events = [
        "phone_detected",
        "person_detected",
    ]

    medium_events = [
        "book_detected",
        "laptop_detected",
        "tab_switch",
        "fullscreen_exit",
        "copy_attempt",
        "paste_attempt",
        "right_click",
    ]

    high_count = sum(1 for log in logs if log.event_type in high_events)
    medium_count = sum(1 for log in logs if log.event_type in medium_events)

    if high_count >= 1 or medium_count >= 4:
        return "high"

    if medium_count >= 1:
        return "medium"

    return "low"


def build_monitoring_report(
    attempt_id: int,
    student_id: int,
    exam_id: int,
    db: Session,
):
    logs = (
        db.query(MonitoringLog)
        .filter(
            MonitoringLog.student_id == student_id,
            MonitoringLog.exam_id == exam_id,
        )
        .all()
    )

    existing_report = (
        db.query(MonitoringReport)
        .filter(MonitoringReport.attempt_id == attempt_id)
        .first()
    )

    report = existing_report or MonitoringReport(
        attempt_id=attempt_id,
        student_id=student_id,
        exam_id=exam_id,
    )

    report.tab_switch_count = sum(1 for log in logs if log.event_type == "tab_switch")
    report.fullscreen_exit_count = sum(
        1 for log in logs if log.event_type == "fullscreen_exit"
    )
    report.phone_detected_count = sum(
        1 for log in logs if log.event_type == "phone_detected"
    )
    report.person_detected_count = sum(
        1 for log in logs if log.event_type == "person_detected"
    )
    report.book_detected_count = sum(
        1 for log in logs if log.event_type == "book_detected"
    )
    report.laptop_detected_count = sum(
        1 for log in logs if log.event_type == "laptop_detected"
    )

    report.risk_level = calculate_report_risk_level(logs)

    if not existing_report:
        db.add(report)

    db.commit()
    db.refresh(report)

    return report


# =========================
# Health
# =========================

@app.get("/api/health")
def health():
    return {"status": "ok"}


# =========================
# Auth Endpoints
# =========================

@app.post("/api/auth/register")
def register(req: RegisterReq, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.identifier == req.identifier).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Ийм хэрэглэгч аль хэдийн бүртгэлтэй байна.",
        )

    role = req.role if req.role in ["student", "teacher", "admin"] else "student"

    user = User(
        identifier=req.identifier,
        password=req.password,
        role=role,
        first_name=req.first_name,
        last_name=req.last_name,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Register OK",
        "user": {
            "id": user.id,
            "identifier": user.identifier,
            "role": user.role,
            "first_name": user.first_name,
            "last_name": user.last_name,
        },
    }


@app.post("/api/auth/login")
def login(req: LoginReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.identifier == req.identifier).first()

    if not user or user.password != req.password:
        raise HTTPException(
            status_code=401,
            detail="Нэвтрэх нэр эсвэл нууц үг буруу байна.",
        )

    access_token = create_access_token(
        data={
            "sub": user.identifier,
            "role": user.role,
            "user_id": user.id,
        }
    )

    return {
        "message": "Login OK",
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user": {
            "id": user.id,
            "identifier": user.identifier,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        },
    }


@app.post("/api/auth/forgot-password")
def forgot(req: ForgotReq):
    otp = "123456"

    print(f"[DEMO OTP] {req.identifier} -> {otp}")

    return {
        "message": f"Reset request received for {req.identifier}",
        "demo_otp": otp,
    }


@app.get("/api/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "identifier": current_user.identifier,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
    }


@app.post("/api/auth/verify-face")
def verify_face(
    req: FaceVerifyReq,
    current_user: User = Depends(get_current_user),
):
    if not req.image:
        raise HTTPException(
            status_code=400,
            detail="Image data байхгүй байна.",
        )

    return {
        "verified": True,
        "message": f"{current_user.first_name} хэрэглэгчийн face verification demo амжилттай.",
        "confidence": 0.93,
    }


# =========================
# Role Dashboard Endpoints
# =========================

@app.get("/api/student/dashboard")
def student_dashboard(current_user: User = Depends(get_current_user)):
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Student эрх шаардлагатай.",
        )

    return {"message": "Student dashboard data"}


@app.get("/api/teacher/dashboard")
def teacher_dashboard(current_user: User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=403,
            detail="Teacher эрх шаардлагатай.",
        )

    return {"message": "Teacher dashboard data"}


@app.get("/api/admin/dashboard")
def admin_dashboard(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin эрх шаардлагатай.",
        )

    return {"message": "Admin dashboard data"}


# =========================
# Exam Endpoints - DB Version
# =========================

@app.get("/api/exams")
def list_exams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Зөвхөн student exam list харна.",
        )

    exams = db.query(Exam).filter(Exam.status == "published").all()

    return {
        "exams": [
            {
                "id": exam.id,
                "title": exam.title,
                "description": exam.description,
                "duration_minutes": exam.duration_minutes,
                "status": exam.status,
            }
            for exam in exams
        ]
    }


@app.post("/api/exams/start")
def start_exam(
    req: StartExamReq,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Зөвхөн student шалгалт эхлүүлнэ.",
        )

    exam = db.query(Exam).filter(Exam.id == req.exam_id).first()

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Шалгалт олдсонгүй.",
        )

    attempt = ExamAttempt(
        exam_id=exam.id,
        student_id=current_user.id,
        status="in_progress",
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    questions = db.query(Question).filter(Question.exam_id == exam.id).all()

    safe_questions = []

    for question in questions:
        answers = db.query(Answer).filter(Answer.question_id == question.id).all()

        safe_questions.append(
            {
                "id": question.id,
                "text": question.text,
                "type": question.type,
                "points": question.points,
                "options": [
                    {
                        "id": answer.option_key,
                        "text": answer.text,
                    }
                    for answer in answers
                ],
            }
        )

    return {
        "attempt_id": attempt.id,
        "exam": {
            "id": exam.id,
            "title": exam.title,
            "description": exam.description,
            "duration_minutes": exam.duration_minutes,
            "questions": safe_questions,
        },
    }


@app.post("/api/exams/submit")
def submit_exam(
    req: SubmitExamReq,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Зөвхөн student submit хийнэ.",
        )

    exam = db.query(Exam).filter(Exam.id == req.exam_id).first()

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Шалгалт олдсонгүй.",
        )

    attempt = (
        db.query(ExamAttempt)
        .filter(
            ExamAttempt.exam_id == exam.id,
            ExamAttempt.student_id == current_user.id,
            ExamAttempt.status == "in_progress",
        )
        .order_by(ExamAttempt.id.desc())
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="Идэвхтэй exam attempt олдсонгүй.",
        )

    questions = db.query(Question).filter(Question.exam_id == exam.id).all()

    total_score = 0
    earned_score = 0
    result_details = []

    for question in questions:
        total_score += question.points

        student_answer = req.answers.get(str(question.id))
        is_correct = student_answer == question.correct_answer
        earned_points = question.points if is_correct else 0

        earned_score += earned_points

        student_answer_record = StudentAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            answer=student_answer,
            is_correct=is_correct,
            earned_points=earned_points,
        )

        db.add(student_answer_record)

        result_details.append(
            {
                "question_id": question.id,
                "student_answer": student_answer,
                "correct_answer": question.correct_answer,
                "is_correct": is_correct,
                "points": earned_points,
            }
        )

    percentage = round((earned_score / total_score) * 100, 2) if total_score else 0

    attempt.status = "submitted"
    attempt.submitted_at = datetime.utcnow()
    attempt.total_score = total_score
    attempt.earned_score = earned_score
    attempt.percentage = percentage

    db.commit()
    db.refresh(attempt)

    report = build_monitoring_report(
        attempt_id=attempt.id,
        student_id=current_user.id,
        exam_id=exam.id,
        db=db,
    )

    logs = (
        db.query(MonitoringLog)
        .filter(
            MonitoringLog.student_id == current_user.id,
            MonitoringLog.exam_id == exam.id,
        )
        .order_by(MonitoringLog.id.asc())
        .all()
    )

    return {
        "message": "Exam submitted successfully",
        "attempt_id": attempt.id,
        "total_score": total_score,
        "earned_score": earned_score,
        "percentage": percentage,
        "details": result_details,
        "monitoring_events": [
            {
                "id": log.id,
                "event_type": log.event_type,
                "risk_level": log.risk_level,
                "details": log.details,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ],
        "monitoring_report": {
            "risk_level": report.risk_level,
            "tab_switch_count": report.tab_switch_count,
            "fullscreen_exit_count": report.fullscreen_exit_count,
            "phone_detected_count": report.phone_detected_count,
            "person_detected_count": report.person_detected_count,
            "book_detected_count": report.book_detected_count,
            "laptop_detected_count": report.laptop_detected_count,
        },
    }


# =========================
# Monitoring Endpoints
# =========================

@app.post("/api/monitoring/log-event")
def log_monitoring_event(
    req: MonitoringLogReq,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempt = (
        db.query(ExamAttempt)
        .filter(
            ExamAttempt.exam_id == req.exam_id,
            ExamAttempt.student_id == current_user.id,
        )
        .order_by(ExamAttempt.id.desc())
        .first()
    )

    risk_level = get_event_risk_level(req.event_type)

    log = MonitoringLog(
        attempt_id=attempt.id if attempt else None,
        exam_id=req.exam_id,
        student_id=current_user.id,
        event_type=req.event_type,
        details=json.dumps(req.details, ensure_ascii=False),
        risk_level=risk_level,
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "message": "Monitoring event logged",
        "log": {
            "id": log.id,
            "event_type": log.event_type,
            "risk_level": log.risk_level,
            "details": log.details,
            "created_at": log.created_at.isoformat(),
        },
    }


@app.get("/api/monitoring/report/{attempt_id}")
def get_monitoring_report(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="Attempt олдсонгүй.",
        )

    if current_user.role == "student" and attempt.student_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Өөр хэрэглэгчийн report харах боломжгүй.",
        )

    report = build_monitoring_report(
        attempt_id=attempt.id,
        student_id=attempt.student_id,
        exam_id=attempt.exam_id,
        db=db,
    )

    return {
        "attempt_id": report.attempt_id,
        "student_id": report.student_id,
        "exam_id": report.exam_id,
        "risk_level": report.risk_level,
        "tab_switch_count": report.tab_switch_count,
        "fullscreen_exit_count": report.fullscreen_exit_count,
        "phone_detected_count": report.phone_detected_count,
        "person_detected_count": report.person_detected_count,
        "book_detected_count": report.book_detected_count,
        "laptop_detected_count": report.laptop_detected_count,
    }


# =========================
# AI Object Detection Demo
# =========================

@app.post("/api/ai/detect-object")
def detect_object(
    req: AIDetectReq,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Зөвхөн student AI monitoring event үүсгэнэ.",
        )

    demo_object = req.demo_object or "phone"

    event_map = {
        "phone": "phone_detected",
        "person": "person_detected",
        "book": "book_detected",
        "laptop": "laptop_detected",
    }

    event_type = event_map.get(demo_object, "unknown_object_detected")
    risk_level = get_event_risk_level(event_type)

    attempt = (
        db.query(ExamAttempt)
        .filter(
            ExamAttempt.exam_id == req.exam_id,
            ExamAttempt.student_id == current_user.id,
        )
        .order_by(ExamAttempt.id.desc())
        .first()
    )

    log = MonitoringLog(
        attempt_id=attempt.id if attempt else None,
        exam_id=req.exam_id,
        student_id=current_user.id,
        event_type=event_type,
        details=json.dumps(
            {
                "source": "AI object detection demo",
                "detected_object": demo_object,
                "note": "This endpoint is prepared for YOLO model integration.",
            },
            ensure_ascii=False,
        ),
        risk_level=risk_level,
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "detected": True,
        "objects": [demo_object],
        "event_type": event_type,
        "risk_level": risk_level,
        "message": f"AI demo detected: {demo_object}",
    }


# =========================
# Teacher/Admin Reports
# =========================

@app.get("/api/teacher/reports")
def teacher_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Teacher/Admin эрх шаардлагатай.",
        )

    attempts = db.query(ExamAttempt).order_by(ExamAttempt.id.desc()).all()

    reports = []

    for attempt in attempts:
        student = db.query(User).filter(User.id == attempt.student_id).first()
        exam = db.query(Exam).filter(Exam.id == attempt.exam_id).first()

        report = build_monitoring_report(
            attempt_id=attempt.id,
            student_id=attempt.student_id,
            exam_id=attempt.exam_id,
            db=db,
        )

        reports.append(
            {
                "attempt_id": attempt.id,
                "student": (
                    f"{student.first_name} {student.last_name}"
                    if student
                    else "Unknown"
                ),
                "exam": exam.title if exam else "Unknown",
                "score": attempt.earned_score,
                "total_score": attempt.total_score,
                "percentage": attempt.percentage,
                "status": attempt.status,
                "risk_level": report.risk_level,
                "tab_switch_count": report.tab_switch_count,
                "fullscreen_exit_count": report.fullscreen_exit_count,
                "phone_detected_count": report.phone_detected_count,
                "person_detected_count": report.person_detected_count,
                "book_detected_count": report.book_detected_count,
                "laptop_detected_count": report.laptop_detected_count,
            }
        )

    return {"reports": reports}


# Хуучин frontend чинь /api/teacher/exam-results ашиглаж байж магадгүй тул
# compatibility endpoint болгон үлдээв.
@app.get("/api/teacher/exam-results")
def teacher_exam_results(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Teacher/Admin эрх шаардлагатай.",
        )

    attempts = db.query(ExamAttempt).order_by(ExamAttempt.id.desc()).all()

    results = []

    for attempt in attempts:
        student = db.query(User).filter(User.id == attempt.student_id).first()
        exam = db.query(Exam).filter(Exam.id == attempt.exam_id).first()

        report = build_monitoring_report(
            attempt_id=attempt.id,
            student_id=attempt.student_id,
            exam_id=attempt.exam_id,
            db=db,
        )

        results.append(
            {
                "id": attempt.id,
                "exam_id": attempt.exam_id,
                "exam_title": exam.title if exam else "Unknown",
                "student_id": attempt.student_id,
                "student_name": (
                    f"{student.first_name} {student.last_name}"
                    if student
                    else "Unknown"
                ),
                "earned_score": attempt.earned_score,
                "total_score": attempt.total_score,
                "percentage": attempt.percentage,
                "risk_level": report.risk_level,
                "tab_switch_count": report.tab_switch_count,
                "fullscreen_exit_count": report.fullscreen_exit_count,
                "phone_detected_count": report.phone_detected_count,
                "person_detected_count": report.person_detected_count,
                "book_detected_count": report.book_detected_count,
                "laptop_detected_count": report.laptop_detected_count,
                "submitted_at": (
                    attempt.submitted_at.isoformat()
                    if attempt.submitted_at
                    else None
                ),
                "status": attempt.status,
            }
        )

    return {"results": results}