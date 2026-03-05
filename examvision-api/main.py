from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="ExamVision API - Sprint1 Stub")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Sprint1-д түр OK
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginReq(BaseModel):
    identifier: str
    password: str

class RegisterReq(BaseModel):
    first_name: str
    last_name: str
    identifier: str
    password: str
    role: str = "student"

class ForgotReq(BaseModel):
    identifier: str

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/auth/login")
def login(req: LoginReq):
    # Demo нууц үг: demo123
    if req.password != "demo123":
        raise HTTPException(status_code=401, detail="Demo password нь demo123")
    return {"message": f"Login OK (identifier={req.identifier})"}

@app.post("/api/auth/register")
def register(req: RegisterReq):
    return {"message": f"Register OK ({req.first_name} {req.last_name}, role={req.role})"}

@app.post("/api/auth/forgot-password")
def forgot(req: ForgotReq):
    return {"message": f"Reset request received for {req.identifier} (stub)"}
