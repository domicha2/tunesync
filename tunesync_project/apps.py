from django.apps import AppConfig


class TuneSyncProjectAppConfig(AppConfig):
    name = "tunesync_project"
    verbose_name = "TuneSync: play it together"

    def ready(self):
        from . import signals

