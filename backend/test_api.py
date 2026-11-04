"""
SmartSpend Backend Test Suite (Phase 2)
Tests Pydantic validation, FastAPI routes, CRUD operations, query filters,
financial summary calculations, and error handling.
"""

import sys
import unittest
from datetime import date, datetime
from decimal import Decimal
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.database import get_supabase_client
from app.main import app
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
)


class MockPostgrestBuilder:
    """Mock builder mimicking Supabase/PostgREST table query chaining."""

    def __init__(self, data_store):
        self.data_store = data_store
        self._action = "select"
        self._filter_id = None
        self._filter_type = None
        self._filter_category = None
        self._filter_start_date = None
        self._filter_end_date = None
        self._filter_currency = None
        self._range_start = 0
        self._range_end = 999
        self._payload = None

    def select(self, columns="*"):
        self._action = "select"
        return self

    def insert(self, payload):
        self._action = "insert"
        self._payload = payload
        return self

    def update(self, payload):
        self._action = "update"
        self._payload = payload
        return self

    def delete(self):
        self._action = "delete"
        return self

    def eq(self, column, val):
        if column == "id":
            self._filter_id = int(val)
        elif column == "type":
            self._filter_type = str(val).lower()
        elif column == "currency":
            self._filter_currency = str(val).upper()
        return self

    def ilike(self, column, pattern):
        if column == "category":
            self._filter_category = pattern.replace("%", "").lower()
        return self

    def gte(self, column, val):
        if column == "transaction_date":
            self._filter_start_date = str(val)
        return self

    def lte(self, column, val):
        if column == "transaction_date":
            self._filter_end_date = str(val)
        return self

    def order(self, column, desc=False):
        return self

    def range(self, start, end):
        self._range_start = start
        self._range_end = end
        return self

    def limit(self, count):
        self._range_end = self._range_start + count - 1
        return self

    def execute(self):
        mock_response = MagicMock()
        if self._action == "insert":
            new_id = len(self.data_store) + 1
            record = dict(self._payload)
            record["id"] = new_id
            record["created_at"] = datetime.now().isoformat()
            self.data_store.append(record)
            mock_response.data = [record]
            return mock_response

        if self._action == "select":
            results = list(self.data_store)
            if self._filter_id is not None:
                results = [r for r in results if r["id"] == self._filter_id]
            if self._filter_type is not None:
                results = [r for r in results if r["type"] == self._filter_type]
            if self._filter_currency is not None:
                results = [r for r in results if r["currency"] == self._filter_currency]
            if self._filter_category is not None:
                results = [r for r in results if self._filter_category in r["category"].lower()]
            if self._filter_start_date is not None:
                results = [r for r in results if str(r["transaction_date"]) >= self._filter_start_date]
            if self._filter_end_date is not None:
                results = [r for r in results if str(r["transaction_date"]) <= self._filter_end_date]
            mock_response.data = results[self._range_start : self._range_end + 1]
            return mock_response

        if self._action == "update":
            matching = [r for r in self.data_store if r["id"] == self._filter_id]
            if not matching:
                mock_response.data = []
            else:
                for k, v in self._payload.items():
                    matching[0][k] = v
                mock_response.data = [matching[0]]
            return mock_response

        if self._action == "delete":
            self.data_store[:] = [r for r in self.data_store if r["id"] != self._filter_id]
            mock_response.data = []
            return mock_response

        mock_response.data = []
        return mock_response


class MockSupabaseClient:
    def __init__(self):
        self.data_store = []

    def table(self, name):
        if name == "transactions":
            return MockPostgrestBuilder(self.data_store)
        raise ValueError(f"Unknown table {name}")


class TestSmartSpendAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mock_client = MockSupabaseClient()
        app.dependency_overrides[get_supabase_client] = lambda: cls.mock_client
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def setUp(self):
        # Reset mock database before each test
        self.mock_client.data_store.clear()

    def test_01_health_and_root(self):
        """Test health check and root endpoints."""
        res_health = self.client.get("/health")
        self.assertEqual(res_health.status_code, 200)
        self.assertEqual(res_health.json(), {"status": "healthy", "application": "SmartSpend"})

        res_root = self.client.get("/")
        self.assertEqual(res_root.status_code, 200)
        self.assertIn("application", res_root.json())

    def test_02_create_income_transaction(self):
        """1. Create an income transaction."""
        payload = {
            "type": "income",
            "amount": 50000.00,
            "category": "Salary",
            "description": "Monthly paycheck",
            "currency": "INR",
            "transaction_date": "2026-11-01",
        }
        res = self.client.post("/api/transactions", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["type"], "income")
        self.assertEqual(data["amount"], 50000.0)
        self.assertEqual(data["category"], "Salary")
        self.assertEqual(data["id"], 1)

    def test_03_create_expense_transaction(self):
        """2. Create an expense transaction."""
        payload = {
            "type": "expense",
            "amount": 250.50,
            "category": "Food",
            "description": "Team Lunch",
            "currency": "INR",
            "transaction_date": "2026-11-04",
        }
        res = self.client.post("/api/transactions", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["type"], "expense")
        self.assertEqual(data["amount"], 250.5)
        self.assertEqual(data["category"], "Food")
        self.assertEqual(data["id"], 1)

    def test_04_get_all_transactions(self):
        """3. Get all transactions."""
        # Insert 2 transactions
        self.client.post("/api/transactions", json={
            "type": "income", "amount": 1000, "category": "Gift", "currency": "INR", "transaction_date": "2026-11-01"
        })
        self.client.post("/api/transactions", json={
            "type": "expense", "amount": 50, "category": "Snacks", "currency": "INR", "transaction_date": "2026-11-02"
        })
        res = self.client.get("/api/transactions")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 2)

    def test_05_get_one_transaction_by_id(self):
        """4. Get one transaction by ID."""
        create_res = self.client.post("/api/transactions", json={
            "type": "income", "amount": 2000, "category": "Bonus", "currency": "INR", "transaction_date": "2026-11-03"
        })
        tx_id = create_res.json()["id"]

        res = self.client.get(f"/api/transactions/{tx_id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["id"], tx_id)
        self.assertEqual(res.json()["category"], "Bonus")

    def test_06_filter_transactions_by_type(self):
        """5. Filter transactions by type."""
        self.client.post("/api/transactions", json={
            "type": "income", "amount": 1000, "category": "Bonus", "currency": "INR", "transaction_date": "2026-11-01"
        })
        self.client.post("/api/transactions", json={
            "type": "expense", "amount": 200, "category": "Fuel", "currency": "INR", "transaction_date": "2026-11-02"
        })

        res_income = self.client.get("/api/transactions?type=income")
        self.assertEqual(res_income.status_code, 200)
        self.assertEqual(len(res_income.json()), 1)
        self.assertEqual(res_income.json()[0]["type"], "income")

        res_expense = self.client.get("/api/transactions?type=expense")
        self.assertEqual(res_expense.status_code, 200)
        self.assertEqual(len(res_expense.json()), 1)
        self.assertEqual(res_expense.json()[0]["type"], "expense")

    def test_07_filter_transactions_by_date(self):
        """6. Filter transactions by date."""
        self.client.post("/api/transactions", json={
            "type": "expense", "amount": 100, "category": "Books", "currency": "INR", "transaction_date": "2026-10-15"
        })
        self.client.post("/api/transactions", json={
            "type": "expense", "amount": 200, "category": "Stationery", "currency": "INR", "transaction_date": "2026-11-02"
        })

        res = self.client.get("/api/transactions?start_date=2026-11-01&end_date=2026-11-30")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 1)
        self.assertEqual(res.json()[0]["category"], "Stationery")

    def test_08_update_transaction(self):
        """7. Update a transaction."""
        create_res = self.client.post("/api/transactions", json={
            "type": "expense", "amount": 150, "category": "Snacks", "currency": "INR", "transaction_date": "2026-11-02"
        })
        tx_id = create_res.json()["id"]

        update_payload = {"amount": 200.0, "description": "Snacks with coffee"}
        res = self.client.put(f"/api/transactions/{tx_id}", json=update_payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["amount"], 200.0)
        self.assertEqual(res.json()["description"], "Snacks with coffee")

    def test_09_delete_transaction_and_verify_removed(self):
        """8 & 9. Delete a transaction and verify deleted records are no longer returned."""
        create_res = self.client.post("/api/transactions", json={
            "type": "expense", "amount": 500, "category": "Utilities", "currency": "INR", "transaction_date": "2026-11-03"
        })
        tx_id = create_res.json()["id"]

        del_res = self.client.delete(f"/api/transactions/{tx_id}")
        self.assertEqual(del_res.status_code, 200)
        self.assertEqual(del_res.json()["message"], "Transaction deleted successfully")

        # Verify 404 on subsequent get
        get_res = self.client.get(f"/api/transactions/{tx_id}")
        self.assertEqual(get_res.status_code, 404)

    def test_10_financial_summary_calculations(self):
        """10. Verify financial summary calculations with decimal accuracy."""
        # 3000.50 Income
        self.client.post("/api/transactions", json={
            "type": "income", "amount": 3000.50, "category": "Stipend", "currency": "INR", "transaction_date": "2026-11-01"
        })
        # 1000.25 Expense
        self.client.post("/api/transactions", json={
            "type": "expense", "amount": 1000.25, "category": "Groceries", "currency": "INR", "transaction_date": "2026-11-02"
        })
        # 500.20 Expense
        self.client.post("/api/transactions", json={
            "type": "expense", "amount": 500.20, "category": "Transit", "currency": "INR", "transaction_date": "2026-11-03"
        })

        res = self.client.get("/api/analytics/summary?currency=INR")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertAlmostEqual(data["total_income"], 3000.50, places=2)
        self.assertAlmostEqual(data["total_expenses"], 1500.45, places=2)
        # 3000.50 - 1500.45 = 1500.05
        self.assertAlmostEqual(data["balance"], 1500.05, places=2)
        self.assertEqual(data["currency"], "INR")

    def test_11_input_validation(self):
        """11. Test invalid inputs."""
        # Negative amount
        res1 = self.client.post("/api/transactions", json={
            "type": "expense", "amount": -50, "category": "Food", "currency": "INR"
        })
        self.assertEqual(res1.status_code, 422)

        # Zero amount
        res2 = self.client.post("/api/transactions", json={
            "type": "income", "amount": 0, "category": "Gift", "currency": "INR"
        })
        self.assertEqual(res2.status_code, 422)

        # Empty category
        res3 = self.client.post("/api/transactions", json={
            "type": "expense", "amount": 100, "category": "   ", "currency": "INR"
        })
        self.assertEqual(res3.status_code, 422)

        # Invalid transaction type
        res4 = self.client.post("/api/transactions", json={
            "type": "donation", "amount": 100, "category": "Charity", "currency": "INR"
        })
        self.assertEqual(res4.status_code, 422)

        # Empty update payload
        res5 = self.client.put("/api/transactions/1", json={})
        self.assertEqual(res5.status_code, 422)

        # Invalid date range filter (start_date > end_date)
        res6 = self.client.get("/api/transactions?start_date=2026-12-01&end_date=2026-11-01")
        self.assertEqual(res6.status_code, 400)

    def test_12_nonexistent_transaction_ids(self):
        """12. Test nonexistent transaction IDs."""
        res_get = self.client.get("/api/transactions/99999")
        self.assertEqual(res_get.status_code, 404)

        res_put = self.client.put("/api/transactions/99999", json={"amount": 100.0})
        self.assertEqual(res_put.status_code, 404)

        res_del = self.client.delete("/api/transactions/99999")
        self.assertEqual(res_del.status_code, 404)


if __name__ == "__main__":
    unittest.main()

