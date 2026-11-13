from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from items.models import Item

from . import services
from .models import Loan
from .serializers import LoanSerializer


class BorrowView(APIView):
    """POST /api/items/<item_id>/borrow/"""

    def post(self, request, item_id):
        item = get_object_or_404(Item, pk=item_id)
        loan = services.request_loan(item, request.user)
        return Response(LoanSerializer(loan).data, status=201)


class LoanViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LoanSerializer

    def get_queryset(self):
        user = self.request.user
        role = self.request.query_params.get("role")
        qs = Loan.objects.select_related("item__owner", "borrower").order_by("-created_at")
        if role == "borrower":
            return qs.filter(borrower=user)
        if role == "lender":
            return qs.filter(item__owner=user)
        return qs.filter(Q(borrower=user) | Q(item__owner=user))

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return Response(LoanSerializer(services.approve_loan(self.get_object(), request.user)).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return Response(LoanSerializer(services.reject_loan(self.get_object(), request.user)).data)

    @action(detail=True, methods=["post"], url_path="return")
    def return_item(self, request, pk=None):
        return Response(LoanSerializer(services.return_loan(self.get_object(), request.user)).data)
