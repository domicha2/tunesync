from channels.generic.websocket import JsonWebsocketConsumer
import json
from django.db.models import signals
from django.dispatch import receiver
import channels.layers
from asgiref.sync import async_to_sync
from tunesync.models import Event


class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        pass

    def events_alarm(self, event):
        self.send_json(event["data"])

    # checks for every event at this point
    # https://stackoverflow.com/questions/46614541/using-django-signals-in-channels-consumer-classes
    @receiver(signals.post_save, sender=Event)
    def event_observer(sender, instance, **kwargs):
        layer = channels.layers.get_channel_layer()
        async_to_sync(layer.send)(
            "order_offer_group", {"type": "events.alarm", "data": instance}
        )

