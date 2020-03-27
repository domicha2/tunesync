"""
ASGI entrypoint. Configures Django and then runs the application
defined in the ASGI_APPLICATION setting.
"""

import os

import django
from channels.routing import get_default_application
import cbsettings

cbsettings.configure("tunesync_project.settings.factory.factory")
django.setup()
application = get_default_application()
