import pytest
import httpx
import uuid
from datetime import date, timedelta

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_vehicle_crud():
    unique_reg = f"TEST-VEH-{uuid.uuid4().hex[:6]}"
    payload = {
        "registration_number": unique_reg,
        "model": "Test Model",
        "type": "Test Type",
        "max_load_capacity": 5000,
        "odometer": 0,
        "acquisition_cost": 10000.0,
        "status": "Available"
    }
    response = httpx.post(f"{BASE_URL}/vehicles/", json=payload)
    assert response.status_code == 201, f"Expected 201, got {response.status_code}. Response: {response.text}"
    data = response.json()
    assert data["registration_number"] == unique_reg
    vehicle_id = data["id"]
    
    response = httpx.get(f"{BASE_URL}/vehicles/{vehicle_id}")
    assert response.status_code == 200
    
    response = httpx.put(f"{BASE_URL}/vehicles/{vehicle_id}", json={"odometer": 100})
    assert response.status_code == 200
    assert response.json()["odometer"] == 100

def test_driver_crud_and_compliance():
    unique_lic = f"TEST-LIC-{uuid.uuid4().hex[:6]}"
    expired_date = str(date.today() - timedelta(days=10))
    payload = {
        "name": "Test Expired Driver",
        "license_number": unique_lic,
        "license_category": "LMV",
        "license_expiry_date": expired_date,
        "contact_number": "1234567890",
        "safety_score": 100,
        "status": "Available"
    }
    response = httpx.post(f"{BASE_URL}/drivers/", json=payload)
    assert response.status_code == 201, f"Expected 201, got {response.status_code}. Response: {response.text}"
    driver_id = response.json()["id"]
    
    response = httpx.put(f"{BASE_URL}/drivers/{driver_id}", json={"status": "On Trip"})
    assert response.status_code == 400, f"Compliance check failed. Response: {response.text}"
    assert "expired" in str(response.json()["detail"]).lower()

def test_trip_dispatch_logic():
    unique_reg = f"TEST-TRIP-V-{uuid.uuid4().hex[:4]}"
    v_payload = {
        "registration_number": unique_reg,
        "model": "Test",
        "type": "Test",
        "max_load_capacity": 10000,
        "odometer": 0,
        "acquisition_cost": 10000.0,
        "status": "Available"
    }
    v_resp = httpx.post(f"{BASE_URL}/vehicles/", json=v_payload)
    assert v_resp.status_code == 201, f"Vehicle setup failed: {v_resp.text}"
    vehicle_id = v_resp.json()["id"]
    
    unique_lic = f"TEST-TRIP-D-{uuid.uuid4().hex[:4]}"
    valid_date = str(date.today() + timedelta(days=365))
    d_payload = {
        "name": "Test Valid Driver",
        "license_number": unique_lic,
        "license_category": "LMV",
        "license_expiry_date": valid_date,
        "safety_score": 100,
        "status": "Available"
    }
    d_resp = httpx.post(f"{BASE_URL}/drivers/", json=d_payload)
    assert d_resp.status_code == 201, f"Driver setup failed: {d_resp.text}"
    driver_id = d_resp.json()["id"]
    
    t_payload = {
        "source": "A",
        "destination": "B",
        "vehicle_id": vehicle_id,
        "driver_id": driver_id,
        "cargo_weight": 20000, 
        "planned_distance": 100
    }
    resp = httpx.post(f"{BASE_URL}/trips/", json=t_payload)
    assert resp.status_code == 400, "Dispatch engine failed to enforce capacity constraint"
    
    t_payload["cargo_weight"] = 5000
    resp = httpx.post(f"{BASE_URL}/trips/", json=t_payload)
    assert resp.status_code == 201, f"Dispatch failed: {resp.text}"
    trip_id = resp.json()["id"]
    
    v_resp = httpx.get(f"{BASE_URL}/vehicles/{vehicle_id}")
    assert v_resp.json()["status"] == "On Trip", "Vehicle lock failed"
    d_resp = httpx.get(f"{BASE_URL}/drivers/{driver_id}")
    assert d_resp.json()["status"] == "On Trip", "Driver lock failed"
    
    resp2 = httpx.post(f"{BASE_URL}/trips/", json=t_payload)
    assert resp2.status_code == 400, "Dispatch allowed double-booking an asset"
    
    resp = httpx.put(f"{BASE_URL}/trips/{trip_id}/complete?actual_distance=120")
    assert resp.status_code == 200, f"Trip completion failed: {resp.text}"
    
    v_resp = httpx.get(f"{BASE_URL}/vehicles/{vehicle_id}")
    assert v_resp.json()["status"] == "Available", "Vehicle unlock failed"
    assert v_resp.json()["odometer"] == 120, "Odometer update failed"
    d_resp = httpx.get(f"{BASE_URL}/drivers/{driver_id}")
    assert d_resp.json()["status"] == "Available", "Driver unlock failed"
