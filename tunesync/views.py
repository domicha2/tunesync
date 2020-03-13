from django.views.generic import TemplateView
from tunesync.models import Event, Room, Membership, Poll, Tune
from json import loads

from django.contrib.auth.models import User
from rest_framework import viewsets
from .permissions import AnonCreateAndUpdateOwnerOnly
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from .serializers import *  # we literally need everything
from rest_framework.renderers import JSONRenderer

from django.db.models import F, Q, Subquery, Value, CharField
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

    permission_classes = [AnonCreateAndUpdateOwnerOnly]

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
        return Response({"id": u.id})

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

    @action(detail=False, methods=["post"])
    def auth(self, request):
        """
        This method creates and sets a cookie for authentication and session management
        """
        user = authenticate(
            username=request.data["username"], password=request.data["password"]
        )
        if user:
            # get or create a token
            token, created = Token.objects.get_or_create(user=user)
            return Response({"token": token.key, "user_id": user.pk})
        else:
            return Response("invalid credentials", status=401)

    @action(methods=["get"], detail=False)
    def whoami(self, request):
        """
        """
        return Response({"username": request.user.username})

    @action(detail=False, methods=["get"])
    def set_password(self, request, pk=None):
        return Response({"status": "password set"})

    @action(detail=True, methods=["get"])
    def rooms(self, request, pk=None):
        rooms = (
            Membership.objects.filter(user=pk)
            .annotate(title=F("room__title"), subtitle=F("room__subtitle"))
            .values("room_id", "role", "state", "title", "subtitle")
            .annotate(id=F("room_id"))
            .values("id", "role", "state", "title", "subtitle")
            .order_by("role", "state", "title", "subtitle")
        )
        return Response(rooms)


class EventViewSet(viewsets.ViewSet):
    """
    """

    # GET
    def list(self, request):
        room_id = int(request.query_params["room"][0])
        event_type = request.query_params["event_type"]
        skip = int(request.query_params["skip"][0])
        limit = int(request.query_params["limit"][0])
        response_data = (
            Event.objects.filter(room__pk=room_id, event_type=event_type)
            .order_by("-creation_time")
            .values()[skip:limit]
        )
        return Response(response_data)

    # POST
    def create(self, request):
        # deserialize
        deserializer = EventSerializer(data=request.data)

        # TODO: check to see why author isnt mandatory
        if not deserializer.is_valid():
            Response(status=404)
            print(deserializer.errors)
        # deserializer.create()
        event = deserializer.save(author=request.user)
        # save into database
        event.save()
        # if request.data["event_type"] == "PO":
        #    poll = Poll(id=event, action=event.event_type, room=event.room)
        # serialize

        serialzer = EventSerializer(event)
        return Response(serialzer.data)


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
        deserializer = RoomSerializer(data=request.data)
        if not deserializer.is_valid():
            return Response(status=404)
        room = deserializer.save(creator=request.user)
        # TODO: Variable scoping with try/catch blocks
        room.save()
        member = Membership(user=request.user, room=room, role="A", state="A")
        member.save()
        serialzer = RoomSerializer(room)
        return Response(serialzer.data)

    @action(methods=["get"], detail=True)
    def events(self, request, pk=None):
        # get all events at this room
        events = (
            Event.objects.all()
            .filter(room=pk)
            .values()
            .order_by("-creation_time")[:100]
        )
        return Response(events)


class TuneViewSet(viewsets.ViewSet):
    # post
    def create(self, request):
        deserializer = TuneSerializer(data=request.data)

        if not deserializer.is_valid():
            print(deserializer.errors)
            return Response(status=404)
        tune = deserializer.save(uploader=request.user)
        tune.save()
        serializer = TuneSerializer(tune)
        return Response(serializer.data)


class MembershipViewSet(viewsets.ModelViewSet):
    """
    Proof of concept viewset using ModelViewSet implementation
    Also, we need a membership viewset anyways
    """

    queryset = Membership.objects.all()
    serializer_class = MembershipSerializer
