import os
from .base import BaseSettings


class ProdSettings(BaseSettings):
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = "<REPLACE ME>"
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True

    DEFAULT_FROM_EMAIL = "<REPLACE ME>"
    EMAIL_HOST_PASSWORD = "<REPLACE ME>"

    SECRET_KEY = "<REPLACE ME>"

    IS_BEHIND_REVERSE_PROXY = True

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql_psycopg2",
            "NAME": "tunesync",
            "USER": "tunesync",
            "PASSWORD": "<REPLACE ME>",
            "HOST": "localhost",
            "PORT": "",
        }
    }

