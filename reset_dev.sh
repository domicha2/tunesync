#!/bin/bash

export DJANGO_DEV=1

rm -rf tmp
mkdir -p tmp

python3 manage.py migrate --run-syncdb
python3 manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_superuser('aaa', 'admin@example.com', '.')"
python3 manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_user('bbb', 'test@example.com', '.')"

