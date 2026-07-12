from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    type = Column(String, nullable=False) # 'Toll', 'Tax', 'Other'
    cost = Column(Numeric, nullable=False)
    date = Column(Date, nullable=False)

    # Back references
    vehicle = relationship("Vehicle", back_populates="expenses")
