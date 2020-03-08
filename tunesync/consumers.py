from channels.generic.websocket import AsyncWebsocketConsumer
import channels.layers
from tunesync.models import Event

class EventConsumer(AsyncWebsocketConsumer):
    async def connect(self):

        user = self.scope["user"]

        self.group_name = 'event-user-{}'.format(user)

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        await self.send("connected")

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        pass
