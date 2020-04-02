import os
from .base import BaseSettings


class DevSettings(BaseSettings):
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    DEFAULT_FROM_EMAIL = "noreply@example.com"

    @property
    def DATABASES(self):
        return {
            "default": {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": "django",
                "USER": "user",
                "PASSWORD": "green123",
                "HOST": "127.0.0.1",
                "PORT": "5432",
            }
        }
