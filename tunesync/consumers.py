from channels.generic.websocket import WebsocketConsumer
import channels
from tunesync.models import Event

class EventConsumer(WebsocketConsumer):
    def connect(self):

        user = self.scope["user"]

        self.group_name = 'event-user-{}'.format(user)
            
        self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )


        self.accept()
        self.send("sex fuck penis connected")

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        pass
