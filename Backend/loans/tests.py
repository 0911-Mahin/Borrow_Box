from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from items.models import Item


class LoanFlowTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", password="secret1")
        self.bob = User.objects.create_user("bob", password="secret2")
        self.item = Item.objects.create(owner=self.alice, title="Drill")

    def test_full_flow(self):
        self.client.force_authenticate(self.bob)
        r = self.client.post(f"/api/items/{self.item.id}/borrow/")
        self.assertEqual(r.status_code, 201)
        loan_id = r.data["id"]

        # borrower can't approve
        self.assertEqual(self.client.post(f"/api/loans/{loan_id}/approve/").status_code, 403)

        self.client.force_authenticate(self.alice)
        self.assertEqual(self.client.post(f"/api/loans/{loan_id}/approve/").data["status"], "approved")
        self.item.refresh_from_db()
        self.assertFalse(self.item.is_available)

        self.assertEqual(self.client.post(f"/api/loans/{loan_id}/return/").data["status"], "returned")
        self.item.refresh_from_db()
        self.assertTrue(self.item.is_available)

    def test_cannot_borrow_own_item(self):
        self.client.force_authenticate(self.alice)
        self.assertEqual(self.client.post(f"/api/items/{self.item.id}/borrow/").status_code, 400)

    def test_both_roles(self):
        # bob lends too: alice borrows from bob
        bobs = Item.objects.create(owner=self.bob, title="Book")
        self.client.force_authenticate(self.alice)
        self.assertEqual(self.client.post(f"/api/items/{bobs.id}/borrow/").status_code, 201)
        self.assertEqual(len(self.client.get("/api/loans/?role=borrower").data), 1)
        self.assertEqual(len(self.client.get("/api/loans/?role=lender").data), 0)
