from sqlalchemy import Column, Integer, Float, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    liters = Column(Float, nullable=False)
    cost = Column(Numeric, nullable=False)
    date = Column(Date, nullable=False)

    # Back references
    vehicle = relationship("Vehicle", back_populates="fuel_logs")
