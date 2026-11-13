from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import BorrowView, LoanViewSet

router = SimpleRouter()
router.register("loans", LoanViewSet, basename="loan")

urlpatterns = [
    path("items/<int:item_id>/borrow/", BorrowView.as_view()),
] + router.urls
