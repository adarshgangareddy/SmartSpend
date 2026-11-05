"""Unit tests for server-side role resolution and admin user management."""
import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.auth import get_current_user
from app.database import get_supabase_admin_client, get_supabase_client
from app.main import app

ADMIN_ID = "00000000-0000-0000-0000-000000000001"
USER_ID = "00000000-0000-0000-0000-000000000002"


class TestAdminUserManagement(unittest.TestCase):
    def setUp(self):
        self.admin_client = MagicMock()
        self.public_client = MagicMock()
        self.current_user = {"id": ADMIN_ID, "email": "admin@example.com", "role": "admin"}
        app.dependency_overrides[get_supabase_admin_client] = lambda: self.admin_client
        app.dependency_overrides[get_supabase_client] = lambda: self.public_client
        app.dependency_overrides[get_current_user] = lambda: self.current_user
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_list_users_whitelists_auth_fields_and_reports_total(self):
        user = SimpleNamespace(
            id=USER_ID,
            email="user@example.com",
            created_at=datetime(2026, 10, 22, 10, tzinfo=timezone.utc),
            last_sign_in_at=None,
            password="must-not-escape",
            access_token="must-not-escape",
        )
        self.admin_client.auth.admin.list_users.return_value = [user]
        profiles = self.admin_client.table.return_value.select.return_value.execute.return_value
        profiles.data = [{"id": USER_ID, "role": "user"}]

        response = self.client.get("/api/admin/users")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["users"][0]["role"], "user")
        self.assertIsNone(data["users"][0]["last_sign_in_at"])
        self.assertNotIn("password", response.text)
        self.assertNotIn("access_token", response.text)

    def test_create_user_defaults_to_user_and_returns_no_secrets(self):
        created = SimpleNamespace(
            id=USER_ID,
            email="new@example.com",
            created_at=None,
            last_sign_in_at=None,
            access_token="must-not-escape",
        )
        self.admin_client.auth.admin.create_user.return_value = SimpleNamespace(user=created)

        response = self.client.post(
            "/api/admin/users",
            json={"email": "New@Example.com", "password": "valid-password-123"},
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["user"]["role"], "user")
        self.assertNotIn("access_token", response.text)
        self.admin_client.table.return_value.upsert.assert_called_once_with(
            {"id": USER_ID, "role": "user"}
        )

    def test_create_user_can_assign_admin_only_via_admin_endpoint(self):
        created = SimpleNamespace(id=USER_ID, email="new@example.com")
        self.admin_client.auth.admin.create_user.return_value = created
        response = self.client.post(
            "/api/admin/users",
            json={"email": "new@example.com", "password": "valid-password-123", "role": "admin"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["user"]["role"], "admin")

    def test_update_email_and_password(self):
        updated = SimpleNamespace(id=USER_ID, email="updated@example.com")
        self.admin_client.auth.admin.update_user_by_id.return_value = SimpleNamespace(user=updated)
        profile = self.admin_client.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value
        profile.data = [{"role": "user"}]

        response = self.client.put(
            f"/api/admin/users/{USER_ID}",
            json={"email": "updated@example.com", "password": "new-valid-password"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["email"], "updated@example.com")
        self.admin_client.auth.admin.update_user_by_id.assert_called_once_with(
            USER_ID,
            {"email": "updated@example.com", "password": "new-valid-password"},
        )

    def test_delete_user_and_reject_self_delete(self):
        existing = SimpleNamespace(user=SimpleNamespace(id=USER_ID))
        self.admin_client.auth.admin.get_user_by_id.return_value = existing
        response = self.client.delete(f"/api/admin/users/{USER_ID}")
        self.assertEqual(response.status_code, 200)
        self.admin_client.auth.admin.delete_user.assert_called_once_with(USER_ID)

        response = self.client.delete(f"/api/admin/users/{ADMIN_ID}")
        self.assertEqual(response.status_code, 400)

    def test_normal_user_is_forbidden_and_unauthenticated_is_401(self):
        self.current_user = {"id": USER_ID, "email": "user@example.com", "role": "user"}
        response = self.client.get("/api/admin/users")
        self.assertEqual(response.status_code, 403)

        app.dependency_overrides.pop(get_current_user)
        response = self.client.get("/api/admin/users")
        self.assertEqual(response.status_code, 401)

    def test_admin_input_validation(self):
        invalid_email = self.client.post(
            "/api/admin/users",
            json={"email": "bad-email", "password": "valid-password-123"},
        )
        self.assertEqual(invalid_email.status_code, 422)
        weak_password = self.client.post(
            "/api/admin/users",
            json={"email": "valid@example.com", "password": "secret"},
        )
        self.assertEqual(weak_password.status_code, 422)
        self.assertNotIn("secret", weak_password.text)
        no_changes = self.client.put(f"/api/admin/users/{USER_ID}", json={})
        self.assertEqual(no_changes.status_code, 422)

    def test_duplicate_email_and_missing_user_errors(self):
        self.admin_client.auth.admin.create_user.side_effect = Exception("User already registered")
        duplicate = self.client.post(
            "/api/admin/users",
            json={"email": "duplicate@example.com", "password": "valid-password-123"},
        )
        self.assertEqual(duplicate.status_code, 409)

        self.admin_client.auth.admin.get_user_by_id.side_effect = Exception("User not found")
        missing = self.client.delete(f"/api/admin/users/{USER_ID}")
        self.assertEqual(missing.status_code, 404)


class TestRoleDetection(unittest.TestCase):
    def tearDown(self):
        app.dependency_overrides.clear()

    def test_verified_identity_includes_profile_role(self):
        auth_user = SimpleNamespace(
            id=ADMIN_ID,
            email="admin@example.com",
            user_metadata={},
            app_metadata={},
            email_confirmed_at="2026-01-01T00:00:00Z",
            confirmed_at=None,
        )
        public_client = MagicMock()
        public_client.auth.get_user.return_value = SimpleNamespace(user=auth_user)
        profile = public_client
        profile.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
            {"role": "admin"}
        ]
        admin_client = MagicMock()
        admin_client.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
            {"role": "admin"}
        ]
        with patch("app.auth.get_supabase_client", return_value=public_client), patch(
            "app.auth.get_supabase_admin_client", return_value=admin_client
        ):
            response = TestClient(app).get(
                "/api/auth/me", headers={"Authorization": "Bearer valid-token"}
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["role"], "admin")

    def test_password_login_returns_role_for_admin_and_user(self):
        for expected_role in ("admin", "user"):
            with self.subTest(role=expected_role):
                public_client = MagicMock()
                auth_user = SimpleNamespace(
                    id=ADMIN_ID,
                    email="account@example.com",
                    user_metadata={"full_name": "Test Account"},
                    email_confirmed_at="2026-01-01T00:00:00Z",
                    confirmed_at=None,
                )
                public_client.auth.sign_in_with_password.return_value = SimpleNamespace(
                    user=auth_user,
                    session=SimpleNamespace(access_token="safe-test-token"),
                )
                admin_client = MagicMock()
                admin_client.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
                    {"role": expected_role}
                ]
                app.dependency_overrides[get_supabase_client] = lambda: public_client
                app.dependency_overrides[get_supabase_admin_client] = lambda: admin_client
                response = TestClient(app).post(
                    "/api/auth/login",
                    json={"email": "account@example.com", "password": "valid-password"},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["user"]["role"], expected_role)
                self.assertEqual(response.json()["role"], expected_role)


if __name__ == "__main__":
    unittest.main()