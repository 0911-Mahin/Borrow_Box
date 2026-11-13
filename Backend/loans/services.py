"""Business rules for the loan lifecycle. Views call these; they raise ValidationError on a broken rule."""
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Loan


def request_loan(item, user):
    if item.owner == user:
        raise ValidationError("You can't borrow your own item.")
    if not item.is_available:
        raise ValidationError("Item is currently lent out.")
    if Loan.objects.filter(item=item, borrower=user, status=Loan.REQUESTED).exists():
        raise ValidationError("You already have a pending request for this item.")
    return Loan.objects.create(item=item, borrower=user)


def _check_lender_and_status(loan, user, required_status):
    if loan.item.owner != user:
        raise PermissionDenied("Only the lender can do this.")
    if loan.status != required_status:
        raise ValidationError(f"Loan must be '{required_status}' (it is '{loan.status}').")


@transaction.atomic
def approve_loan(loan, user):
    _check_lender_and_status(loan, user, Loan.REQUESTED)
    item = loan.item
    if not item.is_available:
        raise ValidationError("Item is already lent out.")
    loan.status = Loan.APPROVED
    loan.save()
    item.is_available = False
    item.save()
    # other pending requests for this item can no longer be fulfilled
    Loan.objects.filter(item=item, status=Loan.REQUESTED).update(status=Loan.REJECTED)
    return loan


def reject_loan(loan, user):
    _check_lender_and_status(loan, user, Loan.REQUESTED)
    loan.status = Loan.REJECTED
    loan.save()
    return loan


@transaction.atomic
def return_loan(loan, user):
    _check_lender_and_status(loan, user, Loan.APPROVED)
    loan.status = Loan.RETURNED
    loan.save()
    loan.item.is_available = True
    loan.item.save()
    return loan
