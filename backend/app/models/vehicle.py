from sqlalchemy import Column, Integer, String, Float, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String, unique=True, index=True, nullable=False)
    model = Column(String, nullable=False)
    type = Column(String, nullable=False)
    max_load_capacity = Column(Float, nullable=False)
    odometer = Column(Integer, default=0)
    acquisition_cost = Column(Numeric, nullable=False)
    region = Column(String, default='North')
    status = Column(String, default='Available') # 'Available', 'On Trip', 'In Shop', 'Retired'

    # Back references
    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")
