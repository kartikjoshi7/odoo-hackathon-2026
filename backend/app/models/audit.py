from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime, timezone
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # e.g., 'DISPATCH_TRIP', 'CREATE_MAINTENANCE'
    target_entity = Column(String, nullable=False)  # e.g., 'Trip: 12'
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
