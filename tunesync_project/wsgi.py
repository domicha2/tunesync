"""
WSGI config for tunesync project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

import cbsettings

cbsettings.configure("tunesync_project.settings.factory.factory")

application = get_wsgi_application()
