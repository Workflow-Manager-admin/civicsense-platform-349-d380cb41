import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from .main import app

ISSUE_ID = 123
MOCK_ISSUE = {
    "id": ISSUE_ID,
    "title": "Test pothole issue",
    "description": "There is a major pothole on the central street",
    "is_deleted": False,
}
MOCK_ISSUE_DELETED = {**MOCK_ISSUE, "is_deleted": True}

client = TestClient(app)

 

def setup_supabase_url():
    import os
    os.environ["SUPABASE_URL"] = "https://mock.supabase.co"
    os.environ["SUPABASE_KEY"] = "mock-key"
    os.environ["SUPABASE_DB_URL"] = "postgresql://mock"


setup_supabase_url()


@pytest.fixture(autouse=True)
def patch_httpx(monkeypatch):
    """Patch httpx.get and httpx.patch for all tests."""
    with patch("httpx.get") as get_mock, patch("httpx.patch") as patch_mock:
        yield get_mock, patch_mock


def build_get_response(json_body, status_code=200):
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.json.return_value = json_body
    return mock_resp


def build_patch_response(status_code=204):
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.status_code = status_code
    return mock_resp


def test_soft_delete_issue_flow(patch_httpx):
    get_mock, patch_mock = patch_httpx

    # Step 1: Mock "create" (simulate as added in "list"), so list returns not deleted
    get_mock.return_value = build_get_response([MOCK_ISSUE])
    resp = client.get(f"/issues/{ISSUE_ID}")
    assert resp.status_code == 200
    assert resp.json()["id"] == ISSUE_ID
    assert resp.json()["is_deleted"] is False

    # Step 2: Soft delete the issue
    patch_mock.return_value = build_patch_response()
    resp = client.delete(f"/issues/{ISSUE_ID}")
    assert resp.status_code == 200
    assert resp.json()["message"].lower().startswith("issue soft-deleted")

    # Step 3: After deletion, /issues/{id} should return 404 (not in non-deleted)
    get_mock.return_value = build_get_response([], status_code=200)
    resp = client.get(f"/issues/{ISSUE_ID}")
    assert resp.status_code == 404

    # Step 4: List deleted issues should include the issue
    get_mock.return_value = build_get_response([MOCK_ISSUE_DELETED])
    resp = client.get("/issues/deleted")
    deleted_list = resp.json()
    assert any(i["id"] == ISSUE_ID and i["is_deleted"] for i in deleted_list)

    # Step 5: Restore the deleted issue
    patch_mock.return_value = build_patch_response()
    resp = client.post(f"/issues/{ISSUE_ID}/restore")
    assert resp.status_code == 200
    assert resp.json()["message"].lower().startswith("issue restored")

    # Step 6: Issue appears in non-deleted list again
    get_mock.return_value = build_get_response([MOCK_ISSUE])
    resp = client.get("/issues")
    open_list = resp.json()
    assert any(
        i["id"] == ISSUE_ID and not i["is_deleted"]
        for i in open_list
    )


def test_restore_nonexistent_issue_returns_404(patch_httpx):
    get_mock, patch_mock = patch_httpx
    # Simulate PATCH returns 404 via status not 204/200
    patch_mock.return_value = build_patch_response(status_code=404)
    resp = client.post("/issues/9999/restore")
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()


def test_soft_delete_nonexistent_issue_returns_404(patch_httpx):
    get_mock, patch_mock = patch_httpx
    patch_mock.return_value = build_patch_response(status_code=404)
    resp = client.delete("/issues/9999")
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()


def test_restore_already_active_issue(patch_httpx):
    get_mock, patch_mock = patch_httpx
    # RESTORE sets is_deleted=False, returns 204/200 if successful, simulate already active by still returning 204
    patch_mock.return_value = build_patch_response()
    # Suppose the API simply succeeds even if already active
    resp = client.post(f"/issues/{ISSUE_ID}/restore")
    assert resp.status_code == 200
    assert "restored" in resp.json()["message"].lower()


def test_soft_delete_already_deleted_issue(patch_httpx):
    get_mock, patch_mock = patch_httpx
    patch_mock.return_value = build_patch_response()
    # Suppose the API always returns 200/204 regardless (idempotent)
    resp = client.delete(f"/issues/{ISSUE_ID}")
    assert resp.status_code == 200
    assert (
        "soft-deleted"
        in resp.json()["message"].lower()
    )
