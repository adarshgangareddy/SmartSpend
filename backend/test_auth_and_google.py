"""
Comprehensive integration tests for SmartSpend Authentication, Google OAuth endpoint,
and protected routes.
"""
import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestSmartSpendAuthAndGoogle(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_health_check(self):
        """Verify API health check endpoint returns 200 OK."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "healthy")

    def test_02_google_oauth_endpoint(self):
        """Verify Google OAuth authorization URL generator generates valid Supabase URL."""
        res = self.client.get(
            "/api/auth/oauth/google",
            params={"redirect_to": "http://localhost:5173/auth/callback"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("provider"), "google")
        self.assertIn("url", data)
        self.assertIn("supabase.co/auth/v1/authorize", data["url"])
        self.assertIn("provider=google", data["url"])
        self.assertIn("http%3A%2F%2Flocalhost%3A5173%2Fauth%2Fcallback", data["url"])

    def test_03_protected_routes_reject_unauthenticated(self):
        """Verify transactions and profile routes strictly reject unauthenticated requests with 401."""
        res_tx = self.client.get("/api/transactions")
        self.assertEqual(res_tx.status_code, 401)
        self.assertIn("Authentication credentials were not provided", res_tx.json().get("detail", ""))

        res_profile = self.client.get("/api/profile")
        self.assertEqual(res_profile.status_code, 401)

    def test_04_reset_password_endpoint(self):
        """Verify password reset request endpoint gracefully accepts requests."""
        res = self.client.post(
            "/api/auth/reset-password",
            json={"email": "testuser@smartspend.app"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("message", res.json())

    def test_05_auth_signup_validation(self):
        """Verify input validation rules on user registration."""
        # Short password
        res = self.client.post(
            "/api/auth/signup",
            json={"email": "valid@email.com", "password": "123", "full_name": "Test"}
        )
        self.assertEqual(res.status_code, 422)

        # Invalid email
        res_bad_email = self.client.post(
            "/api/auth/signup",
            json={"email": "not-an-email", "password": "securepassword123", "full_name": "Test"}
        )
        self.assertEqual(res_bad_email.status_code, 422)


if __name__ == "__main__":
    unittest.main()

