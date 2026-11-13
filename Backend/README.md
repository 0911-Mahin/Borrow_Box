# Lending Backend (Django + DRF)

    python -m venv venv && source venv/bin/activate
    pip install -r requirements.txt
    python manage.py migrate
    python manage.py createsuperuser   # optional, for /admin/
    python manage.py runserver
    python manage.py test              # run tests

Apps: accounts (register/login), items (things to lend), loans (borrow lifecycle + rules in loans/services.py).
