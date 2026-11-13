from rest_framework import serializers

from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = Item
        fields = ["id", "title", "description", "is_available", "owner", "created_at"]
        read_only_fields = ["is_available"]  # only changed by the loan flow
