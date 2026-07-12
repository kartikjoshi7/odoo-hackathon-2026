# 🚛 TransitOps - Smart Transport Operations Platform

> **Odoo Hackathon 2026 Submission**  
> A comprehensive, high-performance, and robust full-stack solution for modern commercial fleet logistics and transport operations.

---

## 📖 Overview

**TransitOps** is an end-to-end Fleet Management platform designed to streamline logistics, ensure vehicle compliance, and optimize transport operations. Built with a focus on strict data integrity and a seamless user experience, the platform enables fleet managers to orchestrate complex logistics workflows without the friction of legacy systems.

---

## ✨ Key Features

- **🛡️ Advanced RBAC (Role-Based Access Control)**: Secure JWT-based authentication ensuring Fleet Managers, Dispatchers, and Drivers only access what they need.
- **🚚 Comprehensive Vehicle Registry**: Track assets, payload capacities, odometers, and live availability statuses.
- **👷 Driver & Compliance Management**: Monitor safety scores, enforce license expiry compliance, and seamlessly assign drivers to trips.
- **🗺️ Intelligent Trip Dispatcher**: Dispatch trips with built-in safeguards that prevent double-booking, overloading limits, or assigning suspended drivers.
- **🔧 Maintenance Tracking**: Log service records and track preventative maintenance lifecycles to minimize fleet downtime.
- **💰 Financials & Expenses**: Centralized ledger for fuel logs, tolls, and maintenance costs with automated roll-ups.
- **📊 Real-Time Analytics**: Beautiful, interactive dashboards providing insights into fleet utilization, cost breakdowns, and trip statistics.

---

## 🏗️ Architecture & Philosophy

TransitOps adheres strictly to the "Odoo Way", focusing on modularity, robust ORM, and domain isolation:

- **Strict MVC Structure**: Clean separation of Models, Routing Controllers, and Business Logic in the backend.
- **Asynchronous ORM**: Fully mapped via asynchronous SQLAlchemy 2.0 with PostgreSQL. Zero raw SQL.
- **Deterministic Validations**: Heavy reliance on Pydantic schemas and database-layer constraints to prevent operational edge-cases (e.g., IntegrityErrors gracefully handled).
- **Modern UI/UX**: A dark-mode native, responsive React frontend powered by Vite, providing an application that feels snappy and premium.

---

## 🛠️ Technology Stack

**Frontend:**
* React 18 + Vite
* Axios (API Client)
* Recharts (Analytics)
* Lucide React (Iconography)

**Backend:**
* Python 3.10+
* FastAPI (High-performance ASGI Framework)
* SQLAlchemy 2.0 (Asyncpg)
* PostgreSQL
* Passlib / JWT (Authentication)

---

## 🚀 Quick Start Guide (Evaluators)

Follow these steps to replicate our environment and launch both the backend and frontend locally.

### 1. Prerequisites
Ensure you have **Python 3.10+**, **Node.js 18+**, and a local instance of **PostgreSQL** running.

### 2. Backend Setup
Navigate to the backend directory, configure the environment, and seed the database with our realistic dummy data.

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment Variables
cp .env.example .env
```
*(Note: Ensure your local PostgreSQL is running on `localhost:5432` and the `transitops` database exists. Update `.env` with your DB credentials if necessary.)*

```bash
# Seed the database (Builds clean schema and injects test data instantly)
python seed.py

# Launch the Backend API Server
uvicorn main:app --reload
```
👉 **Backend Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend Setup
Open a new terminal window for the frontend.

```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
👉 **Frontend Application:** [http://localhost:5174](http://localhost:5174)

---

## 🔐 Demo Credentials

Once the application is running, use the following credentials to access the Fleet Manager dashboard:

* **Email:** `manager@transitops.com`
* **Password:** `password`

*(Additional role-based accounts like `dispatcher@transitops.com` are also seeded automatically by the `seed.py` script.)*

---

<div align="center">
  <i>Built with ❤️ for Odoo Hackathon 2026</i>
</div>
