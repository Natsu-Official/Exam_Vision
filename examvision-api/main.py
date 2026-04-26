from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from pydantic import BaseModel

app = FastAPI(title="ExamVision API - Sprint2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # sprint/demo дээр түр OK
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "examvision_super_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Demo users (түр зуур DB-ийн оронд)
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


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
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
    otp = "123456"  # Sprint2 demo OTP
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


@app.post("/api/auth/verify-face")
def verify_face(req: FaceVerifyReq, current_user: dict = Depends(get_current_user)):
    if not req.image:
        raise HTTPException(status_code=400, detail="Image data байхгүй байна.")

    return {
        "verified": True,
        "message": f"{current_user['first_name']} хэрэглэгчийн face verification demo амжилттай.",
        "confidence": 0.93,
    }