from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from items.models import Item
from .models import Loan


class LoanTestBase(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", password="secret1")
        self.bob = User.objects.create_user("bob", password="secret2")
        self.carol = User.objects.create_user("carol", password="secret3")
        self.item = Item.objects.create(owner=self.alice, title="Drill")

    def as_user(self, user):
        self.client.force_authenticate(user)

    def borrow(self, user, item=None):
        self.as_user(user)
        return self.client.post(f"/api/items/{(item or self.item).id}/borrow/")

    def act(self, user, loan_id, action):
        self.as_user(user)
        return self.client.post(f"/api/loans/{loan_id}/{action}/")


class BorrowTests(LoanTestBase):
    def test_borrow_creates_requested_loan(self):
        r = self.borrow(self.bob)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["status"], "requested")
        self.assertEqual(r.data["lender"], "alice")
        self.assertEqual(r.data["borrower"], "bob")
        self.assertEqual(r.data["item_title"], "Drill")
        self.item.refresh_from_db()
        self.assertTrue(self.item.is_available)  # still available until approved

    def test_cannot_borrow_own_item(self):
        r = self.borrow(self.alice)
        self.assertEqual(r.status_code, 400)
        self.assertIn("own item", r.data["detail"])

    def test_cannot_borrow_unavailable_item(self):
        self.item.is_available = False
        self.item.save()
        r = self.borrow(self.bob)
        self.assertEqual(r.status_code, 400)
        self.assertIn("detail", r.data)

    def test_cannot_send_duplicate_pending_request(self):
        self.borrow(self.bob)
        r = self.borrow(self.bob)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Loan.objects.count(), 1)

    def test_borrow_missing_item_is_404(self):
        self.as_user(self.bob)
        self.assertEqual(self.client.post("/api/items/9999/borrow/").status_code, 404)

    def test_borrow_requires_auth(self):
        self.assertEqual(self.client.post(f"/api/items/{self.item.id}/borrow/").status_code, 401)

    def test_can_borrow_again_after_rejection(self):
        loan_id = self.borrow(self.bob).data["id"]
        self.act(self.alice, loan_id, "reject")
        self.assertEqual(self.borrow(self.bob).status_code, 201)


class LifecycleTests(LoanTestBase):
    def test_full_flow_approve_then_return(self):
        loan_id = self.borrow(self.bob).data["id"]

        r = self.act(self.alice, loan_id, "approve")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], "approved")
        self.item.refresh_from_db()
        self.assertFalse(self.item.is_available)

        r = self.act(self.alice, loan_id, "return")
        self.assertEqual(r.data["status"], "returned")
        self.item.refresh_from_db()
        self.assertTrue(self.item.is_available)

    def test_reject_keeps_item_available(self):
        loan_id = self.borrow(self.bob).data["id"]
        r = self.act(self.alice, loan_id, "reject")
        self.assertEqual(r.data["status"], "rejected")
        self.item.refresh_from_db()
        self.assertTrue(self.item.is_available)

    def test_approve_auto_rejects_other_pending_requests(self):
        bob_loan = self.borrow(self.bob).data["id"]
        carol_loan = self.borrow(self.carol).data["id"]
        self.act(self.alice, bob_loan, "approve")
        self.assertEqual(Loan.objects.get(pk=carol_loan).status, "rejected")
        self.assertEqual(Loan.objects.get(pk=bob_loan).status, "approved")

    def test_item_can_be_lent_again_after_return(self):
        loan_id = self.borrow(self.bob).data["id"]
        self.act(self.alice, loan_id, "approve")
        self.act(self.alice, loan_id, "return")
        self.assertEqual(self.borrow(self.carol).status_code, 201)

    def test_borrower_cannot_approve_reject_or_return(self):
        loan_id = self.borrow(self.bob).data["id"]
        for action in ("approve", "reject", "return"):
            r = self.act(self.bob, loan_id, action)
            self.assertEqual(r.status_code, 403, action)
        self.assertEqual(Loan.objects.get(pk=loan_id).status, "requested")

    def test_cannot_approve_twice(self):
        loan_id = self.borrow(self.bob).data["id"]
        self.act(self.alice, loan_id, "approve")
        r = self.act(self.alice, loan_id, "approve")
        self.assertEqual(r.status_code, 400)

    def test_cannot_return_before_approval(self):
        loan_id = self.borrow(self.bob).data["id"]
        r = self.act(self.alice, loan_id, "return")
        self.assertEqual(r.status_code, 400)
        self.assertIn("detail", r.data)

    def test_cannot_reject_after_approval(self):
        loan_id = self.borrow(self.bob).data["id"]
        self.act(self.alice, loan_id, "approve")
        self.assertEqual(self.act(self.alice, loan_id, "reject").status_code, 400)

    def test_cannot_approve_returned_loan(self):
        loan_id = self.borrow(self.bob).data["id"]
        self.act(self.alice, loan_id, "approve")
        self.act(self.alice, loan_id, "return")
        self.assertEqual(self.act(self.alice, loan_id, "approve").status_code, 400)

    def test_actions_require_auth(self):
        loan_id = self.borrow(self.bob).data["id"]
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post(f"/api/loans/{loan_id}/approve/").status_code, 401)


class LoanListTests(LoanTestBase):
    def test_non_participant_cannot_see_or_act_on_loan(self):
        loan_id = self.borrow(self.bob).data["id"]
        self.as_user(self.carol)
        self.assertEqual(self.client.get(f"/api/loans/{loan_id}/").status_code, 404)
        self.assertEqual(self.client.get("/api/loans/").data, [])
        self.assertEqual(self.act(self.carol, loan_id, "approve").status_code, 404)

    def test_both_participants_can_see_loan(self):
        loan_id = self.borrow(self.bob).data["id"]
        for user in (self.alice, self.bob):
            self.as_user(user)
            self.assertEqual(self.client.get(f"/api/loans/{loan_id}/").status_code, 200)

    def test_user_is_both_lender_and_borrower(self):
        # alice lends the drill to bob AND borrows bob's book
        book = Item.objects.create(owner=self.bob, title="Book")
        self.borrow(self.bob)           # bob borrows alice's drill
        self.borrow(self.alice, book)   # alice borrows bob's book

        self.as_user(self.alice)
        self.assertEqual(len(self.client.get("/api/loans/").data), 2)
        as_lender = self.client.get("/api/loans/?role=lender").data
        as_borrower = self.client.get("/api/loans/?role=borrower").data
        self.assertEqual([l["item_title"] for l in as_lender], ["Drill"])
        self.assertEqual([l["item_title"] for l in as_borrower], ["Book"])

    def test_loan_response_shape(self):
        loan_id = self.borrow(self.bob).data["id"]
        self.as_user(self.alice)
        data = self.client.get(f"/api/loans/{loan_id}/").data
        self.assertEqual(
            set(data),
            {"id", "item", "item_title", "lender", "borrower", "status", "created_at", "updated_at"},
        )

    def test_loans_list_requires_auth(self):
        self.assertEqual(self.client.get("/api/loans/").status_code, 401)