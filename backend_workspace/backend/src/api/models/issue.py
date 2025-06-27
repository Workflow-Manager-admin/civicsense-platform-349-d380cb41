from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime


Base = declarative_base()

# PUBLIC_INTERFACE
class Issue(Base):
    """
    Database model for issues reported by citizens.
    Supports soft deletion via an isDeleted boolean flag.
    """
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    category = Column(String)
    priority = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reporter_id = Column(Integer)
    isDeleted = Column(Boolean, default=False, nullable=False)
