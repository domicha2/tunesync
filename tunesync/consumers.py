from channels.generic.websocket import JsonWebsocketConsumer
import channels
from tunesync.models import Event
from asgiref.sync import async_to_sync
from urllib import parse

# import urlparse


class EventConsumer(JsonWebsocketConsumer):
    def connect(self):
        # I used the below link to find how to get query parameters for the event room.
        # Originally we wanted to send through headers but it was difficult from the client side
        # https://stackoverflow.com/questions/44223458/how-to-get-query-parameters-from-django-channels

        self.accept()

        params = parse.parse_qs(self.scope["query_string"])
        room_id = params.get(b"room_id", (None,))[0]

        if not room_id:
            self.send("no room_id was sent")
            self.close()

        self.group_name = "event-room-{}".format(str(room_id))
        async_to_sync(self.channel_layer.group_add)(self.group_name, self.channel_name)

        self.send("you are connected " + " " + self.group_name)

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        self.send(repr(text_data))

    def user_notify_event(self, event):
        self.send_json(event["text"])
