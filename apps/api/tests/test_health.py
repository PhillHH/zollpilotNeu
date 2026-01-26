import os

from fastapi.testclient import TestClient

from app.main import create_app


def test_health_returns_ok() -> None:
    os.environ["SESSION_SECRET"] = "test-secret"
    client = TestClient(create_app())
    client.headers["X-Contract-Version"] = "1"

    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["status"] == "ok"

