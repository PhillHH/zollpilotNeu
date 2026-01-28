import os

from fastapi.testclient import TestClient

from app.main import create_app


def test_missing_contract_version_returns_400() -> None:
    os.environ["SESSION_SECRET"] = "test-secret"
    client = TestClient(create_app())
    response = client.get("/health")

    assert response.status_code == 400
    body = response.json()
    assert body["error"]["code"] == "CONTRACT_VERSION_INVALID"


def test_invalid_contract_version_returns_400() -> None:
    os.environ["SESSION_SECRET"] = "test-secret"
    client = TestClient(create_app())
    response = client.get("/health", headers={"X-Contract-Version": "2"})

    assert response.status_code == 400
    body = response.json()
    assert body["error"]["code"] == "CONTRACT_VERSION_INVALID"




