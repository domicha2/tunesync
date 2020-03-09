import os
from .base import BaseSettings


class DevSettings(BaseSettings):
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    DEFAULT_FROM_EMAIL = "noreply@example.com"

    CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }