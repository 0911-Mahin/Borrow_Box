from django.conf import settings
from django.db import models

from items.models import Item


class Loan(models.Model):
    REQUESTED, APPROVED, REJECTED, RETURNED = "requested", "approved", "rejected", "returned"
    STATUS_CHOICES = [(s, s) for s in (REQUESTED, APPROVED, REJECTED, RETURNED)]

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="loans")
    borrower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="borrowed_loans")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=REQUESTED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.item.title} -> {self.borrower} [{self.status}]"
