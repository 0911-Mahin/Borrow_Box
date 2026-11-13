from django.contrib.auth.models import User
from rest_framework.test import APITestCase


class RegisterTests(APITestCase):
    def test_register_success_hides_password(self):
        r = self.client.post("/api/register/", {"username": "alice", "password": "secret1"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(set(r.data), {"id", "username"})
        self.assertEqual(r.data["username"], "alice")

    def test_password_is_hashed(self):
        self.client.post("/api/register/", {"username": "alice", "password": "secret1"})
        user = User.objects.get(username="alice")
        self.assertNotEqual(user.password, "secret1")
        self.assertTrue(user.check_password("secret1"))

    def test_duplicate_username(self):
        User.objects.create_user("alice", password="secret1")
        r = self.client.post("/api/register/", {"username": "alice", "password": "secret1"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("username", r.data)

    def test_short_password(self):
        r = self.client.post("/api/register/", {"username": "alice", "password": "123"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("password", r.data)

    def test_missing_fields(self):
        r = self.client.post("/api/register/", {})
        self.assertEqual(r.status_code, 400)
        self.assertIn("username", r.data)
        self.assertIn("password", r.data)


class LoginTests(APITestCase):
    def setUp(self):
        User.objects.create_user("alice", password="secret1")

    def test_login_returns_token(self):
        r = self.client.post("/api/login/", {"username": "alice", "password": "secret1"})
        self.assertEqual(r.status_code, 200)
        self.assertIn("token", r.data)

    def test_wrong_password(self):
        r = self.client.post("/api/login/", {"username": "alice", "password": "nope"})
        self.assertEqual(r.status_code, 400)

    def test_token_authenticates_requests(self):
        token = self.client.post("/api/login/", {"username": "alice", "password": "secret1"}).data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.assertEqual(self.client.get("/api/items/").status_code, 200)

    def test_no_token_is_401(self):
        self.assertEqual(self.client.get("/api/items/").status_code, 401)

    def test_bad_token_is_401(self):
        self.client.credentials(HTTP_AUTHORIZATION="Token garbage")
        self.assertEqual(self.client.get("/api/items/").status_code, 401)