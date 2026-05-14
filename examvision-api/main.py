from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from pydantic import BaseModel

app = FastAPI(title="ExamVision API - Sprint3/Sprint4")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "examvision_super_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

fake_users_db = {
    "student@example.com": {
        "id": 1,
        "identifier": "student@example.com",
        "password": "demo123",
        "role": "student",
        "first_name": "Student",
        "last_name": "User",
    },
    "teacher@example.com": {
        "id": 2,
        "identifier": "teacher@example.com",
        "password": "demo123",
        "role": "teacher",
        "first_name": "Teacher",
        "last_name": "User",
    },
    "admin@example.com": {
        "id": 3,
        "identifier": "admin@example.com",
        "password": "demo123",
        "role": "admin",
        "first_name": "Admin",
        "last_name": "User",
    },
}

fake_exams_db = {
    1: {
        "id": 1,
        "title": "Web Engineering Midterm",
        "description": "React, API, Authentication суурь ойлголтын шалгалт",
        "duration_minutes": 10,
        "status": "published",
        "questions": [
            {
                "id": 1,
                "text": "React нь ямар төрлийн library вэ?",
                "type": "single",
                "points": 2,
                "options": [
                    {"id": "a", "text": "Database library"},
                    {"id": "b", "text": "UI library"},
                    {"id": "c", "text": "Operating system"},
                    {"id": "d", "text": "Network protocol"},
                ],
                "correct_answer": "b",
            },
            {
                "id": 2,
                "text": "JWT юунд ашиглагддаг вэ?",
                "type": "single",
                "points": 2,
                "options": [
                    {"id": "a", "text": "Authentication token"},
                    {"id": "b", "text": "CSS framework"},
                    {"id": "c", "text": "Database engine"},
                    {"id": "d", "text": "Image format"},
                ],
                "correct_answer": "a",
            },
            {
                "id": 3,
                "text": "FastAPI ямар програмчлалын хэл дээр суурилдаг вэ?",
                "type": "single",
                "points": 2,
                "options": [
                    {"id": "a", "text": "Java"},
                    {"id": "b", "text": "Python"},
                    {"id": "c", "text": "PHP"},
                    {"id": "d", "text": "C#"},
                ],
                "correct_answer": "b",
            },
        ],
    }
}

fake_attempts_db = {}
fake_monitoring_logs = []
fake_exam_results = []


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
    details: Dict[str, Any] = {}


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_token_from_header(authorization: Optional[str] = Header(default=None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header байхгүй байна.")

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authorization header буруу байна.")

    return parts[1]


def get_current_user(token: str = Depends(get_token_from_header)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        identifier: Optional[str] = payload.get("sub")
        if not identifier:
            raise HTTPException(status_code=401, detail="Token payload буруу байна.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token хүчингүй байна.")

    user = fake_users_db.get(identifier)
    if not user:
        raise HTTPException(status_code=401, detail="Хэрэглэгч олдсонгүй.")

    return user


def calculate_risk_level(violation_count: int):
    if violation_count >= 5:
        return "High"
    if violation_count >= 3:
        return "Medium"
    return "Low"


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/register")
def register(req: RegisterReq):
    if req.identifier in fake_users_db:
        raise HTTPException(status_code=400, detail="Ийм хэрэглэгч аль хэдийн бүртгэлтэй байна.")

    new_id = len(fake_users_db) + 1
    role = req.role if req.role in ["student", "teacher", "admin"] else "student"

    fake_users_db[req.identifier] = {
        "id": new_id,
        "identifier": req.identifier,
        "password": req.password,
        "role": role,
        "first_name": req.first_name,
        "last_name": req.last_name,
    }

    return {
        "message": "Register OK",
        "user": {
            "id": new_id,
            "identifier": req.identifier,
            "role": role,
            "first_name": req.first_name,
            "last_name": req.last_name,
        },
    }


@app.post("/api/auth/login")
def login(req: LoginReq):
    user = fake_users_db.get(req.identifier)

    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Нэвтрэх нэр эсвэл нууц үг буруу байна.")

    access_token = create_access_token(
        data={
            "sub": user["identifier"],
            "role": user["role"],
            "user_id": user["id"],
        }
    )

    return {
        "message": "Login OK",
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "user": {
            "id": user["id"],
            "identifier": user["identifier"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "role": user["role"],
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
def me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "identifier": current_user["identifier"],
        "first_name": current_user["first_name"],
        "last_name": current_user["last_name"],
        "role": current_user["role"],
    }


@app.post("/api/auth/verify-face")
def verify_face(req: FaceVerifyReq, current_user: dict = Depends(get_current_user)):
    if not req.image:
        raise HTTPException(status_code=400, detail="Image data байхгүй байна.")

    return {
        "verified": True,
        "message": f"{current_user['first_name']} хэрэглэгчийн face verification demo амжилттай.",
        "confidence": 0.93,
    }


@app.get("/api/student/dashboard")
def student_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Student эрх шаардлагатай.")
    return {"message": "Student dashboard data"}


@app.get("/api/teacher/dashboard")
def teacher_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Teacher эрх шаардлагатай.")
    return {"message": "Teacher dashboard data"}


@app.get("/api/admin/dashboard")
def admin_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin эрх шаардлагатай.")
    return {"message": "Admin dashboard data"}


@app.get("/api/exams")
def list_exams(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Зөвхөн student exam list харна.")

    return {
        "exams": [
            {
                "id": exam["id"],
                "title": exam["title"],
                "description": exam["description"],
                "duration_minutes": exam["duration_minutes"],
                "status": exam["status"],
            }
            for exam in fake_exams_db.values()
        ]
    }


@app.post("/api/exams/start")
def start_exam(req: StartExamReq, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Зөвхөн student шалгалт эхлүүлнэ.")

    exam = fake_exams_db.get(req.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Шалгалт олдсонгүй.")

    attempt_id = len(fake_attempts_db) + 1
    fake_attempts_db[attempt_id] = {
        "id": attempt_id,
        "exam_id": req.exam_id,
        "student_id": current_user["id"],
        "started_at": datetime.utcnow().isoformat(),
        "status": "in_progress",
    }

    safe_questions = []
    for q in exam["questions"]:
        safe_questions.append(
            {
                "id": q["id"],
                "text": q["text"],
                "type": q["type"],
                "points": q["points"],
                "options": q["options"],
            }
        )

    return {
        "attempt_id": attempt_id,
        "exam": {
            "id": exam["id"],
            "title": exam["title"],
            "description": exam["description"],
            "duration_minutes": exam["duration_minutes"],
            "questions": safe_questions,
        },
    }


@app.post("/api/exams/submit")
def submit_exam(req: SubmitExamReq, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Зөвхөн student submit хийнэ.")

    exam = fake_exams_db.get(req.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Шалгалт олдсонгүй.")

    total_score = 0
    earned_score = 0
    result_details = []

    for q in exam["questions"]:
        total_score += q["points"]
        student_answer = req.answers.get(str(q["id"]))
        is_correct = student_answer == q["correct_answer"]

        if is_correct:
            earned_score += q["points"]

        result_details.append(
            {
                "question_id": q["id"],
                "student_answer": student_answer,
                "correct_answer": q["correct_answer"],
                "is_correct": is_correct,
                "points": q["points"] if is_correct else 0,
            }
        )

    related_logs = [
        log
        for log in fake_monitoring_logs
        if log["student_id"] == current_user["id"] and log["exam_id"] == req.exam_id
    ]

    violation_types = [
        "tab_switch",
        "fullscreen_exit",
        "copy_attempt",
        "paste_attempt",
        "right_click",
    ]

    violation_count = len(
        [log for log in related_logs if log["event_type"] in violation_types]
    )
    risk_level = calculate_risk_level(violation_count)

    percentage = round((earned_score / total_score) * 100, 2)

    result_record = {
        "id": len(fake_exam_results) + 1,
        "exam_id": req.exam_id,
        "exam_title": exam["title"],
        "student_id": current_user["id"],
        "student_name": f"{current_user['first_name']} {current_user['last_name']}",
        "earned_score": earned_score,
        "total_score": total_score,
        "percentage": percentage,
        "violation_count": violation_count,
        "risk_level": risk_level,
        "submitted_at": datetime.utcnow().isoformat(),
    }

    fake_exam_results.append(result_record)

    return {
        "message": "Exam submitted successfully",
        "total_score": total_score,
        "earned_score": earned_score,
        "percentage": percentage,
        "details": result_details,
        "monitoring_events": related_logs,
        "risk_level": risk_level,
        "violation_count": violation_count,
    }


@app.post("/api/monitoring/log-event")
def log_monitoring_event(req: MonitoringLogReq, current_user: dict = Depends(get_current_user)):
    log = {
        "id": len(fake_monitoring_logs) + 1,
        "student_id": current_user["id"],
        "exam_id": req.exam_id,
        "event_type": req.event_type,
        "details": req.details,
        "created_at": datetime.utcnow().isoformat(),
    }

    fake_monitoring_logs.append(log)

    return {
        "message": "Monitoring event logged",
        "log": log,
    }


@app.get("/api/teacher/exam-results")
def teacher_exam_results(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Teacher эрх шаардлагатай.")

    return {"results": fake_exam_results}