from sqlalchemy import Column, Integer, String, Text, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    description = Column(Text, nullable=False)
    cost = Column(Numeric, default=0.0)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    status = Column(String, default='Open') # 'Open', 'Closed'

    # Back references
    vehicle = relationship("Vehicle", back_populates="maintenance_logs")
