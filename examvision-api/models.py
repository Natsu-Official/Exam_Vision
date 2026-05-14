from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="student")
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    duration_minutes = Column(Integer, default=10)
    status = Column(String, default="published")
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("Question", back_populates="exam")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    text = Column(Text, nullable=False)
    type = Column(String, default="single")
    points = Column(Integer, default=1)
    correct_answer = Column(String, nullable=False)

    exam = relationship("Exam", back_populates="questions")
    answers = relationship("Answer", back_populates="question")


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    option_key = Column(String, nullable=False)
    text = Column(Text, nullable=False)

    question = relationship("Question", back_populates="answers")


class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    status = Column(String, default="in_progress")
    total_score = Column(Integer, default=0)
    earned_score = Column(Integer, default=0)
    percentage = Column(Float, default=0)


class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("exam_attempts.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    answer = Column(String)
    is_correct = Column(Boolean, default=False)
    earned_points = Column(Integer, default=0)


class MonitoringLog(Base):
    __tablename__ = "monitoring_logs"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, nullable=True)
    exam_id = Column(Integer, nullable=False)
    student_id = Column(Integer, nullable=False)
    event_type = Column(String, nullable=False)
    details = Column(Text, default="")
    risk_level = Column(String, default="low")
    created_at = Column(DateTime, default=datetime.utcnow)


class MonitoringReport(Base):
    __tablename__ = "monitoring_reports"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, nullable=False)
    student_id = Column(Integer, nullable=False)
    exam_id = Column(Integer, nullable=False)
    tab_switch_count = Column(Integer, default=0)
    fullscreen_exit_count = Column(Integer, default=0)
    phone_detected_count = Column(Integer, default=0)
    person_detected_count = Column(Integer, default=0)
    book_detected_count = Column(Integer, default=0)
    laptop_detected_count = Column(Integer, default=0)
    risk_level = Column(String, default="low")
    created_at = Column(DateTime, default=datetime.utcnow)