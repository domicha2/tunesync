from django.urls import include, path
from django.conf.urls import url
from rest_framework import routers
from . import views as mine
from rest_framework.authtoken import views

router = routers.DefaultRouter()
router.register(r"users", mine.UserViewSet, basename="user")
router.register(r"events", mine.EventViewSet, basename="event")
router.register(r"rooms", mine.RoomViewSet, basename="room")
router.register(r"tunes", mine.TuneViewSet, basename="tune")
router.register(r"polls", mine.PollViewSet, basename="poll")


# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    path("", include(router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
]
