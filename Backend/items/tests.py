from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Item


class ItemTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", password="secret1")
        self.bob = User.objects.create_user("bob", password="secret2")
        self.drill = Item.objects.create(owner=self.alice, title="Drill")
        self.book = Item.objects.create(owner=self.bob, title="Book", is_available=False)

    # --- create
    def test_create_sets_owner_and_availability(self):
        self.client.force_authenticate(self.alice)
        r = self.client.post("/api/items/", {"title": "Ladder", "description": "6ft"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["owner"], "alice")
        self.assertTrue(r.data["is_available"])
        self.assertEqual(set(r.data), {"id", "title", "description", "is_available", "owner", "created_at"})

    def test_create_ignores_client_supplied_owner_and_availability(self):
        self.client.force_authenticate(self.alice)
        r = self.client.post("/api/items/", {"title": "Ladder", "owner": "bob", "is_available": False})
        self.assertEqual(r.data["owner"], "alice")
        self.assertTrue(r.data["is_available"])

    def test_create_requires_title(self):
        self.client.force_authenticate(self.alice)
        r = self.client.post("/api/items/", {"description": "no title"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("title", r.data)

    def test_create_requires_auth(self):
        self.assertEqual(self.client.post("/api/items/", {"title": "x"}).status_code, 401)

    # --- read / filters
    def test_list_shows_everyones_items(self):
        self.client.force_authenticate(self.alice)
        r = self.client.get("/api/items/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual({i["title"] for i in r.data}, {"Drill", "Book"})

    def test_mine_filter(self):
        self.client.force_authenticate(self.alice)
        r = self.client.get("/api/items/?mine=true")
        self.assertEqual([i["title"] for i in r.data], ["Drill"])

    def test_available_filter(self):
        self.client.force_authenticate(self.alice)
        r = self.client.get("/api/items/?available=true")
        self.assertEqual([i["title"] for i in r.data], ["Drill"])

    def test_retrieve_other_users_item(self):
        self.client.force_authenticate(self.alice)
        r = self.client.get(f"/api/items/{self.book.id}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["owner"], "bob")

    def test_retrieve_missing_is_404(self):
        self.client.force_authenticate(self.alice)
        self.assertEqual(self.client.get("/api/items/9999/").status_code, 404)

    # --- update / delete
    def test_owner_can_patch(self):
        self.client.force_authenticate(self.alice)
        r = self.client.patch(f"/api/items/{self.drill.id}/", {"title": "Power drill"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["title"], "Power drill")

    def test_owner_cannot_change_availability_directly(self):
        self.client.force_authenticate(self.alice)
        self.client.patch(f"/api/items/{self.drill.id}/", {"is_available": False})
        self.drill.refresh_from_db()
        self.assertTrue(self.drill.is_available)

    def test_non_owner_cannot_update(self):
        self.client.force_authenticate(self.bob)
        self.assertEqual(self.client.patch(f"/api/items/{self.drill.id}/", {"title": "x"}).status_code, 403)
        self.assertEqual(self.client.put(f"/api/items/{self.drill.id}/", {"title": "x"}).status_code, 403)

    def test_non_owner_cannot_delete(self):
        self.client.force_authenticate(self.bob)
        self.assertEqual(self.client.delete(f"/api/items/{self.drill.id}/").status_code, 403)
        self.assertTrue(Item.objects.filter(pk=self.drill.id).exists())

    def test_owner_can_delete(self):
        self.client.force_authenticate(self.alice)
        self.assertEqual(self.client.delete(f"/api/items/{self.drill.id}/").status_code, 204)
        self.assertFalse(Item.objects.filter(pk=self.drill.id).exists())