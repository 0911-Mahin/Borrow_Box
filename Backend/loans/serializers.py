from rest_framework import serializers

from .models import Loan


class LoanSerializer(serializers.ModelSerializer):
    item_title = serializers.ReadOnlyField(source="item.title")
    lender = serializers.ReadOnlyField(source="item.owner.username")
    borrower = serializers.ReadOnlyField(source="borrower.username")

    class Meta:
        model = Loan
        fields = ["id", "item", "item_title", "lender", "borrower", "status", "created_at", "updated_at"]
