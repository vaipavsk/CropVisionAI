import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import logging

logging.basicConfig(level=logging.ERROR)

from app.main import app
from app.database.session import get_db, Base
from app.models.user import User, UserRole, UserStatus
from app.models.upload import Upload
from app.models.prediction import Prediction
from app.models.claim import Claim, ClaimStatus
from app.dependencies.auth import get_current_user

# Setup in-memory sqlite db for live API testing
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

db = TestingSessionLocal()

farmer1 = User(id=1, firebase_uid="uid_farmer1", full_name="Syed Farmer", email="syed@gmail.com", role=UserRole.FARMER, status=UserStatus.ACTIVE)
farmer2 = User(id=2, firebase_uid="uid_farmer2", full_name="Raja Farmer", email="raja@gmail.com", role=UserRole.FARMER, status=UserStatus.ACTIVE)
inspector = User(id=3, firebase_uid="uid_inspector", full_name="Main Inspector", email="inspector@cropvision.ai", role=UserRole.INSPECTOR, status=UserStatus.ACTIVE)

db.add_all([farmer1, farmer2, inspector])
db.commit()

upload1 = Upload(id=1, user_id=1, file_name="f1.jpg", file_path="/tmp/f1.jpg", original_name="f1.jpg")
upload2 = Upload(id=2, user_id=2, file_name="f2.jpg", file_path="/tmp/f2.jpg", original_name="f2.jpg")
db.add_all([upload1, upload2])
db.commit()

pred1 = Prediction(id=1, upload_id=1, model_name="effnet", confidence_score=0.95, damage_class="Corn___Common_rust", status="COMPLETED")
pred2 = Prediction(id=2, upload_id=2, model_name="effnet", confidence_score=0.88, damage_class="Potato___Early_blight", status="COMPLETED")
db.add_all([pred1, pred2])
db.commit()

client = TestClient(app)

print("=== 1. UNAUTHENTICATED REQUESTS (EXPECT 401) ===")
res = client.get("/claims")
print("GET /claims without token -> Status:", res.status_code, "| Response:", res.json())
assert res.status_code == 401

res = client.post("/claims", json={"prediction_id": 1, "amount": 5000})
print("POST /claims without token -> Status:", res.status_code, "| Response:", res.json())
assert res.status_code == 401


print("\n=== 2. FARMER CLAIM CREATION & OWNERSHIP ENFORCEMENT ===")
def get_farmer1(db_session=None):
    s = TestingSessionLocal()
    return s.query(User).filter(User.id == 1).first()

app.dependency_overrides[get_current_user] = get_farmer1

res = client.post("/claims", json={"prediction_id": 1, "amount": 6500.0, "status": "SUBMITTED"})
print("Farmer 1 POST /claims (own prediction) -> Status:", res.status_code, "| Serialized Status:", res.json().get("status"), "| Farmer:", res.json().get("farmer", {}).get("email"))
assert res.status_code == 201
assert res.json()["status"] in ["UNDER_REVIEW", "SUBMITTED", "PENDING"]
assert res.json()["farmer"]["email"] == "syed@gmail.com"

# Farmer 1 attempts to create claim for Farmer 2's prediction 2 (EXPECT 404/403)
res = client.post("/claims", json={"prediction_id": 2, "amount": 4000.0})
print("Farmer 1 POST /claims (other farmer's prediction) -> Status:", res.status_code, "| Detail:", res.json().get("detail"))
assert res.status_code in [403, 404]


print("\n=== 3. FARMER DATA ISOLATION (GET /claims/mine) ===")
res = client.get("/claims/mine")
print("Farmer 1 GET /claims/mine -> Status:", res.status_code, "| Claim Count:", len(res.json()))
assert res.status_code == 200
assert len(res.json()) == 1
assert res.json()[0]["prediction"]["id"] == 1


print("\n=== 4. FORBIDDEN FARMER ADJUDICATION (EXPECT 403) ===")
res = client.put("/claims/1/approve")
print("Farmer 1 PUT /claims/1/approve -> Status:", res.status_code, "| Detail:", res.json().get("detail"))
assert res.status_code == 403

res = client.put("/claims/1/reject", json={"reason": "Self rejection"})
print("Farmer 1 PUT /claims/1/reject -> Status:", res.status_code, "| Detail:", res.json().get("detail"))
assert res.status_code == 403


print("\n=== 5. FARMER 2 CREATES CLAIM ===")
def get_farmer2(db_session=None):
    s = TestingSessionLocal()
    return s.query(User).filter(User.id == 2).first()

app.dependency_overrides[get_current_user] = get_farmer2
res = client.post("/claims", json={"prediction_id": 2, "amount": 8000.0, "status": "SUBMITTED"})
print("Farmer 2 POST /claims (own prediction) -> Status:", res.status_code, "| Serialized Status:", res.json().get("status"), "| Farmer Email:", res.json().get("farmer", {}).get("email"))
assert res.status_code == 201
assert res.json()["farmer"]["email"] == "raja@gmail.com"


print("\n=== 6. INSPECTOR MULTI-FARMER QUEUE VISIBILITY (GET /claims) ===")
def get_insp(db_session=None):
    s = TestingSessionLocal()
    return s.query(User).filter(User.id == 3).first()

app.dependency_overrides[get_current_user] = get_insp

res = client.get("/claims")
claims_list = res.json()
print("Inspector GET /claims -> Status:", res.status_code, "| Total Claims Loaded:", len(claims_list))
farmer_emails = [c["farmer"]["email"] for c in claims_list if c.get("farmer")]
print("Farmers in Inspector Queue:", farmer_emails)
assert res.status_code == 200
assert len(claims_list) == 2
assert "syed@gmail.com" in farmer_emails
assert "raja@gmail.com" in farmer_emails


print("\n=== 7. INSPECTOR ADJUDICATION (APPROVE & REJECT WITH REASON) ===")
# Approve Claim 1
res = client.put("/claims/1/approve", json={"reason": "Verified field damage via satellite and Grad-CAM"})
print("Inspector PUT /claims/1/approve -> Status:", res.status_code, "| Claim Status:", res.json().get("status"))
assert res.status_code == 200
assert res.json()["status"] == "APPROVED"

# Reject Claim 2 with Reason
res = client.put("/claims/2/reject", json={"reason": "Damage percentage below 10% policy threshold"})
print("Inspector PUT /claims/2/reject -> Status:", res.status_code, "| Claim Status:", res.json().get("status"), "| Reason:", res.json().get("reason"))
assert res.status_code == 200
assert res.json()["status"] == "REJECTED"
assert res.json()["reason"] == "Damage percentage below 10% policy threshold"


print("\n=== 8. DUPLICATE CLAIM PREVENTION TEST ===")
app.dependency_overrides[get_current_user] = get_farmer1
res_dup = client.post("/claims", json={"prediction_id": 1, "amount": 9999.0})
print("Duplicate POST /claims for prediction 1 -> Status:", res_dup.status_code, "| Retained Claim ID:", res_dup.json().get("id"))
assert res_dup.status_code in [200, 201]
assert res_dup.json()["id"] == 1

print("\n>>> ALL API & SECURITY VERIFICATION TESTS PASSED SUCCESSFULLY! <<<")
