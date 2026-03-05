# ExamVision — Sprint 1 (v0.1)

Онлайн шалгалтын шударга байдлыг хангах систем (ExamVision) — Sprint 1 demo.

## 1) Project structure
ExamVision/
examvision-client/ # React (Vite) frontend
examvision-api/ # FastAPI backend (Sprint1 stub)
README.md


## 2) Requirements

- Node.js 18+
- Python 3.10+

## 3) Run Backend (FastAPI)

### 3.1 Create & activate venv
From `examvision-api/`:

**Windows (PowerShell)**
```powershell
python -m venv .venv
.venv\Scripts\activate# ExamVision — Sprint 1 (v0.1)

Онлайн шалгалтын шударга байдлыг хангах систем (ExamVision) — Sprint 1 demo.

## Project structure

ExamVision/
├ examvision-client/   → React (Vite) frontend
├ examvision-api/      → FastAPI backend (Sprint1 stub)
└ README.md

---

## Requirements

* Node.js 18+
* Python 3.10+

---

# 1. Backend ажиллуулах (FastAPI)

### 1.1 Backend folder руу орно

cd examvision-api

### 1.2 Virtual environment үүсгэнэ

Windows PowerShell

python -m venv .venv
.venv\Scripts\activate

Mac / Linux

python -m venv .venv
source .venv/bin/activate

### 1.3 Dependencies суулгана

python -m pip install fastapi "uvicorn[standard]"

### 1.4 Сервер асаана

python -m uvicorn main:app --reload --port 8000

### 1.5 Backend ажиллаж байгааг шалгах

Browser дээр нээнэ:

http://127.0.0.1:8000/api/health

Хэрэв зөв бол дараах JSON гарна:

{"status":"ok"}

---

# 2. Frontend ажиллуулах (React + Vite)

### 2.1 Frontend folder руу орно

cd examvision-client

### 2.2 Dependencies суулгана

npm install

### 2.3 Environment config үүсгэнэ

examvision-client дотор `.env` файл үүсгэнэ.

Дотор нь:

VITE_API_BASE_URL=http://127.0.0.1:8000

### 2.4 Frontend сервер асаана

npm run dev

### 2.5 App нээх

Browser дээр:

http://localhost:5173

---

# 3. Sprint 1 Demo (үзлэгт үзүүлэх)

### Backend endpoints

GET /api/health
POST /api/auth/login
POST /api/auth/register
POST /api/auth/forgot-password

---

# 4. Demo хийх алхам

1. Browser дээр http://localhost:5173 нээнэ

2. Login page дээр

Identifier: [test@example.com](mailto:test@example.com)
Password: demo123

Login дарна

Expected result:

Login OK (API)

Backend console дээр:

POST /api/auth/login 200 OK

---

3. Register page

Form бөглөөд submit дарна

Expected result:

Register OK

---

4. Forgot Password page

Identifier оруулж submit дарна

Expected result:

Reset request received

---

5. Settings page

User background color өөрчилнө

Page refresh хийхэд өнгө хэвээр хадгалагдана
(localStorage ашигласан)

---

# 5. Sprint 1 хүрээнд хийсэн зүйлс

* React (Vite) frontend project structure
* Login / Register / Forgot password UI
* Axios ашигласан API connection
* FastAPI backend stub
* CORS configuration
* React → FastAPI API communication
* User theme/background color customization

---

# 6. Sprint 2 дээр хийх зүйлс

* JWT authentication
* Role-based dashboard (Student / Teacher / Admin)
* Face verification prototype
* Protected routes
* Database integration

---

# Sprint 1 Status

Frontend → Backend API connection working
Login / Register / Forgot endpoints working
Local theme customization implemented

Sprint 1 Completed
