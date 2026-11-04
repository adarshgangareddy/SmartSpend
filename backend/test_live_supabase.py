"""
SmartSpend Live Integration Test Suite
Executes live CRUD operations against the configured Supabase database
to verify persistence and real database communication.
"""

import sys
import unittest
from datetime import date
from fastapi.testclient import TestClient
from app.main import app


class TestLiveSupabaseIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.created_ids = []

    @classmethod
    def tearDownClass(cls):
        # Clean up any test records left behind
        for tid in cls.created_ids:
            try:
                cls.client.delete(f"/api/transactions/{tid}")
            except Exception:
                pass

    def test_01_create_income(self):
        """1. Create an income transaction in live Supabase."""
        payload = {
            "type": "income",
            "amount": 25000.00,
            "category": "Salary",
            "description": "Live Test Stipend",
            "currency": "INR",
            "transaction_date": "2026-11-01",
        }
        res = self.client.post("/api/transactions", json=payload)
        self.assertEqual(res.status_code, 201, f"Response: {res.text}")
        data = res.json()
        self.assertIn("id", data)
        self.assertEqual(data["type"], "income")
        self.assertEqual(data["amount"], 25000.0)
        self.created_ids.append(data["id"])

    def test_02_create_expense(self):
        """2. Create an expense transaction in live Supabase."""
        payload = {
            "type": "expense",
            "amount": 750.50,
            "category": "Food",
            "description": "Live Test Lunch",
            "currency": "INR",
            "transaction_date": "2026-11-04",
        }
        res = self.client.post("/api/transactions", json=payload)
        self.assertEqual(res.status_code, 201, f"Response: {res.text}")
        data = res.json()
        self.assertIn("id", data)
        self.assertEqual(data["type"], "expense")
        self.assertEqual(data["amount"], 750.5)
        self.created_ids.append(data["id"])

    def test_03_get_all_transactions(self):
        """3. Get all transactions from live Supabase."""
        res = self.client.get("/api/transactions")
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertIsInstance(items, list)
        self.assertGreaterEqual(len(items), 2)

    def test_04_get_one_by_id(self):
        """4. Get one transaction by ID from live Supabase."""
        target_id = self.created_ids[0]
        res = self.client.get(f"/api/transactions/{target_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], target_id)
        self.assertEqual(data["category"], "Salary")

    def test_05_filter_by_type(self):
        """5. Filter transactions by type in live Supabase."""
        res = self.client.get("/api/transactions?type=income")
        self.assertEqual(res.status_code, 200)
        for tx in res.json():
            self.assertEqual(tx["type"], "income")

    def test_06_filter_by_date(self):
        """6. Filter transactions by date in live Supabase."""
        res = self.client.get("/api/transactions?start_date=2026-11-01&end_date=2026-11-05")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.json()), 2)

    def test_07_update_transaction(self):
        """7. Update a transaction in live Supabase."""
        target_id = self.created_ids[1]
        res = self.client.put(
            f"/api/transactions/{target_id}",
            json={"amount": 800.0, "description": "Updated Lunch with beverages"},
        )
        self.assertEqual(res.status_code, 200, f"Response: {res.text}")
        updated = res.json()
        self.assertEqual(updated["amount"], 800.0)
        self.assertEqual(updated["description"], "Updated Lunch with beverages")

    def test_08_delete_transaction(self):
        """8. Delete a transaction from live Supabase."""
        # Create a temp record specifically to delete
        temp = self.client.post("/api/transactions", json={
            "type": "expense",
            "amount": 99.0,
            "category": "Temp",
            "currency": "INR",
            "transaction_date": "2026-11-04"
        }).json()
        temp_id = temp["id"]

        del_res = self.client.delete(f"/api/transactions/{temp_id}")
        self.assertEqual(del_res.status_code, 200, f"Response: {del_res.text}")
        self.assertEqual(del_res.json()["message"], "Transaction deleted successfully")

        # 9. Verify deleted record is no longer returned
        get_res = self.client.get(f"/api/transactions/{temp_id}")
        self.assertEqual(get_res.status_code, 404)

    def test_10_financial_summary(self):
        """10. Verify financial summary calculations from live Supabase."""
        res = self.client.get("/api/analytics/summary?currency=INR")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total_income", data)
        self.assertIn("total_expenses", data)
        self.assertIn("balance", data)
        # Check that balance = total_income - total_expenses
        self.assertAlmostEqual(data["balance"], data["total_income"] - data["total_expenses"], places=2)

    def test_11_invalid_inputs(self):
        """11. Test invalid inputs against live endpoints."""
        res = self.client.post("/api/transactions", json={"type": "invalid", "amount": -10, "category": ""})
        self.assertEqual(res.status_code, 422)

    def test_12_nonexistent_id(self):
        """12. Test nonexistent transaction IDs against live endpoints."""
        res = self.client.get("/api/transactions/999999999")
        self.assertEqual(res.status_code, 404)


if __name__ == "__main__":
    unittest.main()

