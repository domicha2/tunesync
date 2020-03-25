from django.views.generic import TemplateView
from tunesync.models import Event, Room, Membership, Tune, TuneSync, Poll
from json import loads, dumps

from django.contrib.auth.models import User
from rest_framework import viewsets
from .permissions import (
    AnonCreateAndUpdateOwnerOnly,
    InRoomOnlyEvents,
    DjOrAbove,
    RoomAdminOnly,
    JoinPendingOnly,
    UploaderOnly,
    InRoomOnly,
)
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from .serializers import *  # we literally need everything
from rest_framework.parsers import MultiPartParser
from rest_framework import status
from django.http import HttpResponse

from django.db.models import F, Q, Subquery, Value, CharField
from django.contrib.auth import authenticate, login
import mutagen

from .filters import TuneFilter

from .event_handlers import PollTask, Handler


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
        if "skip" not in request.query_params:
            skip = 0
        else:
            skip = int(request.query_params["skip"])

        if "limit" not in request.query_params:
            limit = 5
        else:
            limit = int(request.query_params["limit"])
        users = User.objects.exclude(pk=request.user.id).order_by("username")[
            skip:limit
        ]
        result = []
        for user in users:
            serializer = UserSerializer(user)
            result.append(serializer.data)
        return Response(result)

    # POST
    def create(self, request):
        try:
            u = User.objects.create_user(
                username=request.data["username"], password=request.data["password"]
            )
        except:
            return Response(
                {"details": "Username already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = UserSerializer(u)
        room = Room(title="System Room", creator=u, system_user=u)
        room.save()
        membership = Membership(user=u, room=room, state="A", role="A")
        membership.save()

        token = Token.objects.create(user=u)
        response = {
            "token": token.key,
            "user_id": u.pk
        }
        return Response(response)

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
            token = Token.objects.get(user=user)
            return Response({"token": token.key, "user_id": user.pk})
        else:
            return Response(
                {"details": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )

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
            Membership.objects.filter(user=pk, state="A")
            .annotate(title=F("room__title"), subtitle=F("room__subtitle"))
            .values("room_id", "role", "state", "title", "subtitle")
            .annotate(id=F("room_id"))
            .values("id", "role", "state", "title", "subtitle")
            .order_by("role", "state", "title", "subtitle")
        )
        return Response(rooms)


class EventViewSet(viewsets.ViewSet):

    # permission_classes = [InRoomOnlyEvents, DjOrAbove, RoomAdminOnly, JoinPendingOnly]

    # GET
    def list(self, request):
        if "event_type" in request.query_params:
            event_type = request.query_params["event_type"]
        try:
            room_id = int(request.query_params["room"])
            skip = int(request.query_params["skip"])
            limit = int(request.query_params["limit"])
        except:
            return Response(
                {"details": "Missing query params"}, status=status.HTTP_400_BAD_REQUEST
            )
        response_data = (
            Event.objects.filter(room__pk=room_id, event_type=event_type)
            .order_by("-creation_time")
            .values()[skip:limit]
        )
        return Response(response_data)

    # POST
    def create(self, request):
        if not set(request.data) <= {"room", "args", "event_type", "parent_event"}:
            return Response(status=400)
        room = Room.objects.get(pk=request.data["room"])
        if not room:
            return Response(
                {"details": "room does not exist"}, status=status.HTTP_400_BAD_REQUEST
            )
        event = Event(
            author=request.user,
            room=room,
            event_type=request.data["event_type"],
            args=request.data["args"],
        )
        if "parent_event" in request.data:
            parent_event = Event.is_valid_parent(room, request.data["parent_event"])
            if parent_event:
                event.parent_event = parent_event[0]
            else:
                return Response(
                    {"details": "invalid parent event"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        handle_event = getattr(Handler, "handle_" + event.event_type)
        result = handle_event(request.data["args"], event, user=request.user)
        return result

    # DELETE
    def destroy(self, request, pk=None):
        event = Event.objects.filter(id = pk)
        if event:
            event = event[0]
            event.isDeleted = True
            event.save()
            return Response(status=status.HTTP_202_ACCEPTED)
        else:
            return Response(
                {"details": "invalid event id"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class RoomViewSet(viewsets.ViewSet):
    """
    """

    permission_classes = [UploaderOnly, InRoomOnly]

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
            Event.objects.filter(room=pk)
            .values("args", "parent_event_id", "creation_time", "event_type")
            .annotate(
                username=F("author__username"),
                event_id=F("id"),
                user_id=F("author"),
                room_id=F("room"),
            )
            .order_by("-creation_time")[:100]
        )
        return Response(events)

    @action(methods=["get"], detail=True)
    def users(self, request, pk=None):
        # get all user in this room
        users = (
            Membership.objects.filter(room=pk, state="A")
            .values("role", "state")
            .annotate(membershipId=F("id"), userId=F("user"), name=F("user__username"))
            .order_by("role", "state", "name")
        )
        return Response(users)

    @action(methods=["get"], detail=True)
    def tunesync(self, request, pk=None):
        result = TuneSync.get_tune_sync(pk)
        return Response(result)


class TuneViewSet(viewsets.ViewSet):
    permission_classes = [AnonCreateAndUpdateOwnerOnly]
    parser_classes = [MultiPartParser]

    def list(self, request):
        results = TuneFilter(request.GET, queryset=Product.objects.all())
        Response(results.values())

    @action(url_path="meta", methods=["get"], detail=True)
    def get_meta(self, request, pk=None):
        tune = Tune.objects.get(pk=pk)
        serializer = TuneSerializer(tune)
        return Response(serializer.data)

    @action(url_path="data", methods=["get"], detail=True)
    def get_data(self, request, pk=None):
        tune = Tune.objects.get(pk=pk)
        with open(tune.audio_file.path, "rb") as f:
            file_data = f.read()
        return HttpResponse(file_data, content_type=tune.mime)

    # post
    def create(self, request):
        result = []
        for song in request.FILES:
            audio = mutagen.File(request.FILES[song], easy=True)
            tune = Tune(
                name=audio["title"],
                artist=audio["artist"],
                album=audio["album"],
                uploader=request.user,
                length=audio.info.length,
                mime=audio.mime[0],
                audio_file=request.FILES[song],
            )
            tune.save()
            serializer = TuneSerializer(tune)
            result.append(serializer.data)
        return Response(result)

    # PATCH
    def partial_update(self, request, pk=None):
        # Check if given tune is even in the db
        tune = Tune.objects.filter(id = pk)
        if tune:
            tune = tune[0]
            if "tune_name" in request.data:
                tune.name = request.data["tune_name"]
            if "tune_artist" in request.data:
                tune.artist = request.data["tune_artist"]
            if "tune_album" in request.data:
                tune.album = request.data["tune_album"]
            tune.save()
            serializer = TuneSerializer(tune)
            return Response(serializer.data)
        else:
            return Response(
                {"details": "invalid tune id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # READ
    def list(self, request):
        tunes = Tune.objects.values("id", "name", "length").order_by("name")
        return Response(tunes)


class MembershipViewSet(viewsets.ModelViewSet):
    """
    Proof of concept viewset using ModelViewSet implementation
    Also, we need a membership viewset anyways
    """

    queryset = Membership.objects.all()
    serializer_class = MembershipSerializer
