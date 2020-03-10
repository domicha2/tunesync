from django.views.generic import TemplateView
from tunesync.models import Event, Room

from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import UserSerializer

from django.db.models import F
from django.contrib.auth import authenticate, login


class IndexPage(TemplateView):
    template_name = "index.html"


class UserViewSet(viewsets.ViewSet):
    """
    Example empty viewset demonstrating the standard
    actions that will be handled by a router class.

    If you're using format suffixes, make sure to also include
    the `format=None` keyword argument for each action.
    """

    # GET
    def list(self, request):
        response_data = User.objects.all().filter(is_active=True).values()
        return Response(response_data)

    # POST
    def create(self, request):
        u = User.objects.create_user(
            username=request.data["username"], password=request.data["password"]
        )
        u.save()
        return Response({"id": u.id, "token": "testing"})

    # GET BY PK
    def retrieve(self, request, pk=None):
        pass

    # PUT
    def update(self, request, pk=None):
        pass

    # PATCH?
    def partial_update(self, request, pk=None):
        pass

    # DELETE
    def destroy(self, request, pk=None):
        pass

    @action(detail=True, method=["post"])
    def auth(self, request):
        """
        This method creates and sets a cookie for authentication and session management
        """
        user = authenticate(
            username=request.data["username"], password=request.data["password"]
        )
        if user:
            login(request, user)
            return Response()
        else:
            return Response(status=401)

    @action(method=["get"])
    def whoami(self, request):
        """
        """
        return Response(request.user.username)


class EventViewSet(viewsets.ViewSet):
    """
    """

    # GET
    def list(self, request):
        response_data = Event.objects.all().filter().values()
        return Response(response_data)

    # POST
    def create(self, request):
        if "parent_event_id" in request.data:
            parent_event_id = request.data["parent_event_id"]
        else:
            parent_event_id = None

        room = Room.objects.get(pk=request.data["room_id"])
        author = User.objects.get(pk=request.data["author"])

        event = Event(
            room=room,
            author=author,
            parent_event_id=parent_event_id,
            args=request.data["args"],
            event_type=request.data["event_type"],
        )
        event.save()
        return Response(event.id)


class RoomViewSet(viewsets.ViewSet):
    """
    """

    # GET
    def list(self, request):
        response_data = (
            Room.objects.all()
            .annotate(name=F("title"))
            .values("name", "id")
            .order_by("name")
        )
        return Response(response_data)

    # POST
    def create(self, request):
        creator = User.objects.get(pk=request.data["creator"])
        room = Room(
            title=request.data["title"],
            subtitle=request.data["subtitle"],
            creator=creator,
        )
        room.save()
        return Response(room.id)

