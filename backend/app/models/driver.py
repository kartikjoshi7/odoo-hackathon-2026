from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import relationship
from app.core.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    license_category = Column(String, nullable=False)
    license_expiry_date = Column(Date, nullable=False)
    contact_number = Column(String)
    safety_score = Column(Integer, default=100)
    status = Column(String, default='Available') # 'Available', 'On Trip', 'Off Duty', 'Suspended'

    # Back references
    trips = relationship("Trip", back_populates="driver")
