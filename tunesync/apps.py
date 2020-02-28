from django.apps import AppConfig


class TuneSyncAppConfig(AppConfig):
    name = "tunesync"
    verbose_name = "TuneSync: play it together"

    def ready(self):
        from . import signals

