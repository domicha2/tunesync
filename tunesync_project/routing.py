from django.conf.urls import url

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

from tunesync.consumers import EventConsumer

application = ProtocolTypeRouter(
    {
        # WebSocket chat handler
        "websocket": AuthMiddlewareStack(URLRouter([url(r"^ws/$", EventConsumer)]))
    }
)
