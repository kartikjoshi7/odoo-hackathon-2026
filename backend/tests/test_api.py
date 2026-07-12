import pytest
import httpx
import uuid
import time
from datetime import date, timedelta

BASE_URL = "http://127.0.0.1:8000/api/v1"

@pytest.fixture(scope="module")
def admin_token():
    response = httpx.post(
        f"{BASE_URL}/auth/login",
        data={"username": "manager@transitops.com", "password": "hackathon123"}
    )
    assert response.status_code == 200, "Admin login failed"
    return response.json()["access_token"]

@pytest.fixture(scope="module")
def driver_token():
    response = httpx.post(
        f"{BASE_URL}/auth/login",
        data={"username": "driver@transitops.com", "password": "hackathon123"}
    )
    assert response.status_code == 200, "Driver login failed"
    return response.json()["access_token"]

def admin_headers(token):
    return {"Authorization": f"Bearer {token}"}

def driver_headers(token):
    return {"Authorization": f"Bearer {token}"}

def test_1_registration_and_privilege_escalation():
    # Attempt to register as Fleet Manager (role_id=1)
    unique_email = f"hacker_{uuid.uuid4().hex[:6]}@test.com"
    payload = {
        "email": unique_email,
        "password": "hackathon_test",
        "role_id": 1
    }
    response = httpx.post(f"{BASE_URL}/auth/register", json=payload)
    assert response.status_code == 201, "Registration failed"
    
    # Assert the backend safely forced the role to 2 (Driver)
    data = response.json()
    assert data["role_id"] == 2, "Privilege Escalation vulnerability exists!"

    # Test duplicate email rejection
    response2 = httpx.post(f"{BASE_URL}/auth/register", json=payload)
    assert response2.status_code == 400, "Duplicate email check failed"


def test_3_rbac_integrity(driver_token):
    # A driver trying to create a maintenance log
    headers = driver_headers(driver_token)
    payload = {
        "vehicle_id": 1,
        "description": "Hacked",
        "cost": 1000,
        "start_date": str(date.today())
    }
    response = httpx.post(f"{BASE_URL}/maintenance/", json=payload, headers=headers)
    assert response.status_code == 403, "RBAC failed: Driver accessed Fleet Manager route!"

def test_4_vehicle_and_driver_crud(admin_token):
    headers = admin_headers(admin_token)
    unique_reg = f"TST-{uuid.uuid4().hex[:4]}"
    
    # Create Vehicle
    v_payload = {
        "registration_number": unique_reg,
        "model": "Test",
        "type": "Test",
        "max_load_capacity": 5000,
        "odometer": 0,
        "acquisition_cost": 10000.0,
        "status": "Available"
    }
    v_resp = httpx.post(f"{BASE_URL}/vehicles/", json=v_payload, headers=headers)
    assert v_resp.status_code == 201
    
    # Create Driver with Expired License
    unique_lic = f"LIC-{uuid.uuid4().hex[:4]}"
    expired_date = str(date.today() - timedelta(days=10))
    d_payload = {
        "name": "Expired Driver",
        "license_number": unique_lic,
        "license_category": "HMV",
        "license_expiry_date": expired_date,
        "contact_number": "0000",
        "safety_score": 100,
        "status": "Available"
    }
    d_resp = httpx.post(f"{BASE_URL}/drivers/", json=d_payload, headers=headers)
    assert d_resp.status_code == 201
    driver_id = d_resp.json()["id"]
    
    # Test License Compliance
    d_put = httpx.put(f"{BASE_URL}/drivers/{driver_id}", json={"status": "On Trip"}, headers=headers)
    assert d_put.status_code == 400
    assert "expired" in str(d_put.json()["detail"]).lower()

def test_5_dispatch_physics_and_double_booking(admin_token):
    headers = admin_headers(admin_token)
    
    # Setup valid vehicle & driver
    unique_reg = f"TST-V-{uuid.uuid4().hex[:4]}"
    v_payload = {"registration_number": unique_reg, "model": "Test", "type": "Test", "max_load_capacity": 5000, "odometer": 0, "acquisition_cost": 1000.0, "status": "Available"}
    v_resp = httpx.post(f"{BASE_URL}/vehicles/", json=v_payload, headers=headers)
    vehicle_id = v_resp.json()["id"]
    
    unique_lic = f"TST-D-{uuid.uuid4().hex[:4]}"
    valid_date = str(date.today() + timedelta(days=100))
    d_payload = {"name": "Valid", "license_number": unique_lic, "license_category": "LMV", "license_expiry_date": valid_date, "safety_score": 100, "status": "Available"}
    d_resp = httpx.post(f"{BASE_URL}/drivers/", json=d_payload, headers=headers)
    driver_id = d_resp.json()["id"]
    
    # Test Overweight Physics
    t_payload = {
        "source": "A", "destination": "B", "vehicle_id": vehicle_id, "driver_id": driver_id, "cargo_weight": 10000, "planned_distance": 100
    }
    t_resp = httpx.post(f"{BASE_URL}/trips/", json=t_payload, headers=headers)
    assert t_resp.status_code == 400
    assert "exceeds vehicle capacity" in str(t_resp.json()["detail"]).lower()
    
    # Test Valid Dispatch & Double Booking
    t_payload["cargo_weight"] = 2000
    t_resp = httpx.post(f"{BASE_URL}/trips/", json=t_payload, headers=headers)
    assert t_resp.status_code == 201, f"Dispatch failed: {t_resp.text}"
    trip_id = t_resp.json()["id"]
    
    # Assets should be locked
    assert httpx.get(f"{BASE_URL}/vehicles/{vehicle_id}", headers=headers).json()["status"] == "On Trip"
    assert httpx.get(f"{BASE_URL}/drivers/{driver_id}", headers=headers).json()["status"] == "On Trip"
    
    # Try double booking
    t_resp2 = httpx.post(f"{BASE_URL}/trips/", json=t_payload, headers=headers)
    assert t_resp2.status_code == 400
    assert "conflict" in str(t_resp2.json()["detail"]).lower()

    # Test Cancellation unlocks assets
    c_resp = httpx.put(f"{BASE_URL}/trips/{trip_id}/cancel", headers=headers)
    assert c_resp.status_code == 200
    assert c_resp.json()["status"] == "Cancelled"
    
    assert httpx.get(f"{BASE_URL}/vehicles/{vehicle_id}", headers=headers).json()["status"] == "Available"
    assert httpx.get(f"{BASE_URL}/drivers/{driver_id}", headers=headers).json()["status"] == "Available"

def test_6_maintenance_locks(admin_token):
    headers = admin_headers(admin_token)
    
    unique_reg = f"TST-M-{uuid.uuid4().hex[:4]}"
    v_payload = {"registration_number": unique_reg, "model": "Test", "type": "Test", "max_load_capacity": 5000, "odometer": 0, "acquisition_cost": 1000.0, "status": "Available"}
    v_resp = httpx.post(f"{BASE_URL}/vehicles/", json=v_payload, headers=headers)
    vehicle_id = v_resp.json()["id"]
    
    m_payload = {
        "vehicle_id": vehicle_id,
        "description": "Oil Change",
        "cost": 500,
        "start_date": str(date.today())
    }
    m_resp = httpx.post(f"{BASE_URL}/maintenance/", json=m_payload, headers=headers)
    assert m_resp.status_code == 201
    log_id = m_resp.json()["id"]
    
    # Vehicle should be locked to 'In Shop'
    assert httpx.get(f"{BASE_URL}/vehicles/{vehicle_id}", headers=headers).json()["status"] == "In Shop"
    
    # Close Maintenance unlocks vehicle
    m_put = httpx.put(f"{BASE_URL}/maintenance/{log_id}/close", headers=headers)
    assert m_put.status_code == 200
    assert httpx.get(f"{BASE_URL}/vehicles/{vehicle_id}", headers=headers).json()["status"] == "Available"

def test_7_financials_and_kpis(admin_token):
    headers = admin_headers(admin_token)
    
    f_payload = {
        "vehicle_id": 1,
        "liters": 50.0,
        "cost": 5000.0,
        "date": str(date.today())
    }
    f_resp = httpx.post(f"{BASE_URL}/financials/fuel", json=f_payload, headers=headers)
    assert f_resp.status_code == 201
    
    costs = httpx.get(f"{BASE_URL}/financials/vehicles/1/costs", headers=headers)
    assert costs.status_code == 200
    assert costs.json()["total_operational_cost"] > 0
    
    kpis = httpx.get(f"{BASE_URL}/dashboard/kpis", headers=headers)
    assert kpis.status_code == 200
    data = kpis.json()["kpis"]
    assert "fleet_utilization_percent" in data
    assert "fleet_roi_percent" in data
