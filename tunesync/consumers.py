from channels.generic.websocket import WebsocketConsumer
import channels
from tunesync.models import Event
from asgiref.sync import async_to_sync

class EventConsumer(WebsocketConsumer):
    def connect(self):

        user = self.scope["user"]

        self.group_name = 'event-user-{}'.format(user)

        async_to_sync(self.channel_layer.group_add)(
            self.group_name,
            self.channel_name
        )


        self.accept()
        self.send("you are connected" + str(user) + ' ' +self.group_name)

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        self.send(repr(text_data))

    def user_notify_event(self, event):
        self.send(event['text']['args'])
