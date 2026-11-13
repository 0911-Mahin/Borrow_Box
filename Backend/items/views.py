from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Item
from .permissions import IsOwner
from .serializers import ItemSerializer


class ItemViewSet(viewsets.ModelViewSet):
    serializer_class = ItemSerializer

    def get_permissions(self):
        perms = [IsAuthenticated()]
        if self.action in ("update", "partial_update", "destroy"):
            perms.append(IsOwner())  # only the lender can edit/delete
        return perms

    def get_queryset(self):
        qs = Item.objects.select_related("owner").order_by("-created_at")
        params = self.request.query_params
        if params.get("mine") == "true":
            qs = qs.filter(owner=self.request.user)
        if params.get("available") == "true":
            qs = qs.filter(is_available=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
