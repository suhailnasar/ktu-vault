from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()
engine = create_engine("sqlite:///ktu.db")
Session = sessionmaker(bind=engine)

class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True)
    semester = Column(Integer)
    branch = Column(String(20))
    subject_code = Column(String(20))
    subject_name = Column(String(200))
    category = Column(String(20))
    title = Column(String(300))
    file_path = Column(String(500))
    extracted_text = Column(Text)

class StudyPlan(Base):
    __tablename__ = "study_plans"
    id = Column(Integer, primary_key=True)
    subject_code = Column(String(20))
    topic = Column(String(500))
    scheduled_date = Column(String(20))
    completed = Column(Integer, default=0)

Base.metadata.create_all(engine)
print("Database ready!")