from json import dumps, loads
from hashlib import sha256
import os

import mutagen
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.db.models import CharField, F, Q, Subquery, Value
from django.http import HttpResponse
from django.views.generic import TemplateView
from django.views.static import serve
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from tunesync.models import Event, Membership, Poll, Room, Tune, TuneSync

from .event_handlers import Handler, PollTask
from .filters import TuneFilter, UserFilter, EventFilter
from .permissions import *  # we literally need everything
from .serializers import *  # we literally need everything


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
        # https://stackoverflow.com/questions/44048156/django-filter-use-paginations

        paginator = PageNumberPagination()
        filtered_set = UserFilter(request.GET, queryset=User.objects.all()).qs
        context = paginator.paginate_queryset(filtered_set, request)
        serializer = UserSerializer(context, many=True)
        return paginator.get_paginated_response(serializer.data)

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
        room = Room(title="Personal Room", creator=u, system_user=u)
        room.save()
        membership = Membership(user=u, room=room, state="A", role="A")
        membership.save()

        token = Token.objects.create(user=u)
        response = {"token": token.key, "user_id": u.pk}
        return Response(response)

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

    permission_classes = [InRoomOnlyEvents, DjOrAbove, RoomAdminOnly, JoinPendingOnly]

    # POST
    def create(self, request):
        """
        We cannot use the serializer class to do validation for events because
        of how we use args as a jsonfield. The event class is very complicated
        and has alot of intermediate steps that must be validated. In this case
        we deal with them with handlers for each event type
        """
        if not set(request.data) <= {"room", "args", "event_type", "parent_event"}:
            return Response({"details": "bad arguments"}, status=400)
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
        handler = Handler(event, request.user)
        handle_event = getattr(handler, "handle_" + event.event_type)
        result = handle_event()
        return result

    # DELETE
    def destroy(self, request, pk=None):
        event = Event.objects.filter(id=pk)
        if event:
            event = event[0]
            event.isDeleted = True
            event.save()
            return Response(status=status.HTTP_202_ACCEPTED)
        else:
            return Response(
                {"details": "invalid event id"}, status=status.HTTP_400_BAD_REQUEST
            )


class RoomViewSet(viewsets.ViewSet):
    """
    """

    permission_classes = [UploaderOnly, InRoomOnly]

    # POST
    def create(self, request):
        deserializer = RoomSerializer(data=request.data)
        if not deserializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST)
        title = request.data.get("title", None)
        if not title:
            return Response(
                {"details": "title must not be empty"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if title == "Personal Room":
            return Response(
                {"details": "title must not be 'Personal Room'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        room = deserializer.save(creator=request.user)
        room.save()
        member = Membership(user=request.user, room=room, role="A", state="A")
        member.save()
        serialzer = RoomSerializer(room)
        return Response(serialzer.data)

    @action(methods=["get"], detail=True)
    def events(self, request, pk=None):
        # get all events at this room
        # TODO: paginate this and add filter
        paginator = PageNumberPagination()
        queryset = Event.objects.filter(room_id=pk).exclude(
            event_type__in=["T", "PO", "V"]
        )
        filtered_set = EventFilter(request.GET, queryset=queryset).qs
        renamed_set = (
            filtered_set.order_by("-creation_time")
            .values("args", "parent_event_id", "creation_time", "event_type")
            .annotate(
                username=F("author__username"),
                event_id=F("id"),
                user_id=F("author"),
                room_id=F("room"),
            )
            .exclude(isDeleted=True)
        )
        context = paginator.paginate_queryset(renamed_set, request)
        return paginator.get_paginated_response(context)

    @action(methods=["get"], detail=True)
    def users(self, request, pk=None):
        # get all user in this room
        # TODO paginate this if theres time for jason
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

    @action(methods=["get"], detail=True)
    def polls(self, request, pk=None):
        paginator = PageNumberPagination()
        active_polls = Poll.objects.filter(event__room_id=pk, is_active=True)
        context = paginator.paginate_queryset(active_polls, request)
        result = []
        for poll in context:
            result.append(poll.get_state())
        return paginator.get_paginated_response(result)


def extract_metadata(audio, key):
    data = audio.get(key, None)
    if not data:
        result = ""
    elif isinstance(data, list):
        result = data[0]
    return result


def extract_all_metadata(audio):
    result = {}
    for meta in audio:
        result[meta] = extract_metadata(audio, meta)
    return result


class TuneViewSet(viewsets.ViewSet):
    permission_classes = [UploaderOnly]
    parser_classes = [MultiPartParser]

    def list(self, request):
        paginator = PageNumberPagination()
        filtered_set = TuneFilter(request.GET, queryset=Tune.objects.all()).qs.order_by(
            "name"
        )
        context = paginator.paginate_queryset(filtered_set, request)
        serializer = TuneSerializer(context, many=True)
        return paginator.get_paginated_response(serializer.data)

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
        response = HttpResponse(file_data, content_type=tune.mime)
        response["Accept-Ranges"] = "bytes"
        return response

    # post
    def create(self, request):
        tunes = []
        for song in request.FILES:
            file = request.FILES[song]
            audio = mutagen.File(file, easy=True)
            if audio is None:
                return Response(
                    {"details": "{} is not an audio file".format(song)},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            file.seek(0)
            hash_object = sha256()
            for chunk in file.chunks():
                hash_object.update(chunk)
            hash_value = hash_object.hexdigest()
            colliding_songs = Tune.objects.filter(hash_value=hash_value)
            if colliding_songs:
                audio_file = colliding_songs[0].audio_file
            else:
                # this is so we dont store the same file multiple times but allow users to upload multiple songs
                audio_file = file
            meta = extract_all_metadata(audio)
            tune = Tune(
                name=meta["title"],
                artist=meta["artist"],
                album=meta["album"],
                uploader=request.user,
                length=audio.info.length,
                mime=audio.mime[0],
                audio_file=audio_file,
                hash_value=hash_value,
            )
            tunes.append(tune)
        result = []
        for tune in tunes:
            tune.save()
            serializer = TuneSerializer(tune)
            result.append(serializer.data)
        return Response(result)

    # PATCH
    def partial_update(self, request, pk=None):
        # Check if given tune is even in the db
        # TODO: check if this can be done better lol
        tune = Tune.objects.filter(id=pk)
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
                {"details": "invalid tune id"}, status=status.HTTP_400_BAD_REQUEST
            )

    # READ
    def destroy(self, request, pk=None):
        tune = Tune.objects.filter(id=pk)
        if tune:
            tune = tune[0]
            colliding_tunes = Tune.objects.filter(hash_value=tune.hash_value).exclude(
                pk=pk
            )
            if not colliding_tunes:
                os.remove(tune.audio_file.path)
            tune.delete()
            return Response(status=status.HTTP_202_ACCEPTED)
        else:
            return Response(
                {"details": "invalid event id"}, status=status.HTTP_400_BAD_REQUEST
            )
