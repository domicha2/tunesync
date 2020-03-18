from django.views.generic import TemplateView
from tunesync.models import Event, Room, Membership, Tune, TuneSync, Poll
from json import loads, dumps

from django.contrib.auth.models import User
from rest_framework import viewsets
from .permissions import AnonCreateAndUpdateOwnerOnly
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from .serializers import *  # we literally need everything
from rest_framework.parsers import MultiPartParser
from django.http import HttpResponse

from django.db.models import F, Q, Subquery, Value, CharField
from django.contrib.auth import authenticate, login
import mutagen


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
        u = User.objects.create_user(
            username=request.data["username"], password=request.data["password"]
        )
        serializer = UserSerializer(u)
        room = Room(title="System Room", creator=u, system_user=u)
        room.save()
        membership = Membership(user=u, room=room, state="A", role="A")
        membership.save()
        return Response(serializer.data)

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
            Membership.objects.filter(user=pk, state="A")
            .annotate(title=F("room__title"), subtitle=F("room__subtitle"))
            .values("room_id", "role", "state", "title", "subtitle")
            .annotate(id=F("room_id"))
            .values("id", "role", "state", "title", "subtitle")
            .order_by("role", "state", "title", "subtitle")
        )
        return Response(rooms)


class EventViewSet(viewsets.ViewSet):
    def validate_PL(self, args):
        if set(args.keys()) >= {"queue_index", "is_playing", "timestamp"}:
            return (
                isinstance(args["queue_index"], int)
                and isinstance(args["is_playing"], bool)
                and (
                    isinstance(args["timestamp"], float)
                    or isinstance(args["timestamp"], int)
                )
            )
        else:
            return False

    def validate_MQ(self, args):
        if "queue" in args:
            return isinstance(args["queue"], list)
        else:
            return False

    def handle_M(self, request, event, **kw):
        """
        we just need to confirm that there is a content value in the payload
        """
        args = request.data["args"]
        if "content" in args:
            if isinstance(args["content"], str):
                event.save()
                serializer = EventSerializer(event)
                return Response(serializer.data)
        return Response(status=400)

    def handle_PO(self, request, event, **kw):
        """
        Handler for all types of polling:
        Play(PL), Kick(U), Modify Queue(MQ)
        """
        args = request.data["args"]
        if not self.validate_PO(args):
            print("Improper polling request")
            return Response(status=400)
        # save event to table
        event.save()
        # retrieve room the poll is happening in
        polling_room = event.room
        action_type = args["action"]
        # Check if the action is a kick, we want to store K
        if action_type == "U":
            action_type = "K"
        poll_event = Poll(
            event=event,
            action=action_type,
            room=polling_room,
            # not sure what i have to put in here?
            # roomId so we know where to have the poll?
            args={"room_id": polling_room.id, "room_name": polling_room.title},
        )
        # save the poll and we're done
        poll_event.save()
        return Response(status=200)

    def handle_V(self, request, event, **kw):
        """
        Handler for the voting on any polls in a room
        """
        args = request.data["args"]
        if not self.validate_V(args):
            print("Improper vote format")
            return Response(status=400)
        # save event to Event table
        event.save()
        agree_field = args["agree"]
        user = request.user
        poll = Event.objects.filter(id=request.data["parent_event"])
        vote_event = Vote(event=event, poll=poll, user=user, agree=agree_field)
        # save the vote
        vote_event.save()
        return Response(status=200)

    def validate_V(self, args):
        if "agree" in args:
            return isinstance(args["agree"], bool)
        else:
            return False

    def handle_T(self, request, event):
        """
        Returns status code to use
        """
        event.save()
        tunesync = TuneSync(event_id=event.id)
        args = request.data["args"]
        if "modify_queue" in args:
            if not self.validate_MQ(args["modify_queue"]):
                print("here")
                return Response(status=400)
            result = []
            for song_id in args["modify_queue"]["queue"]:
                tune = Tune.objects.filter(pk=song_id).values()
                result.append([song_id, tune[0]["length"], tune[0]["name"]])
            tunesync.modify_queue = result
        if "play" in args:
            if not self.validate_PL(args["play"]):
                print("no here")
                return Response(status=400)
            tunesync.play = args["play"]
        tunesync.save()
        result = TuneSync.get_tune_sync(event.room.id)
        return Response(result, status=200)

    def validate_U(self, args):
        event_type = args["type"]
        if event_type == "K":
            return "user" in args
        elif event_type == "I":
            return "users" in args
        elif event_type == "J":
            return "is_accepted" in args
        elif event_type == "C":
            return set(args.keys()) == {"type", "user", "role"}
        else:
            return True
        return False

    def handle_U_I(self, args, event, request, **kw):
        for user in args["users"]:
            system_room = Room.objects.get(system_user__id=user)
            u_obj = User.objects.get(pk=user)
            membership = Membership(room=event.room, user=u_obj, state="P", role="R")
            membership.save()
            invite_event = Event(
                room=system_room,
                author=request.user,
                event_type="U",
                args={
                    "type": "I",
                    "room_id": event.room.id,
                    "room_name": event.room.title,
                },
            )
            invite_event.save()
        return 200

    def handle_U_J(self, args, event, request, **kw):
        user = request.user
        if args["is_accepted"]:
            membership = Membership.objects.get(room=event.room, user=user)
            membership.state = "A"
            membership.save()
        else:
            membership = Membership.objects.get(room=event.room, user=user)
            membership.state = "R"
            membership.save()
        return 200

    def handle_U_K(self, args, event, request, **kw):
        user = request.user
        system_room = Room.objects.get(system_user__id=args["user"])
        kick_event = Event(
            author=user,
            room=system_room,
            event_type="U",
            args={"type": "K", "room": event.room.id},
        )
        # let them know they've been kicked lol
        kick_event.save()
        # delete user from room
        Membership.objects.get(room=event.room, user__id=args["user"]).delete()
        return 200

    def handle_U_C(self, args, event, **kw):
        membership = Membership.objects.get(user__id=args["user"], room=event.room)
        membership.role = args["role"]
        membership.save()
        return 200

    def handle_U(self, request, event, **kw):
        args = request.data["args"]
        if "type" in args:
            if args["type"] in {"K", "I", "J", "L", "C"}:
                if self.validate_U(args):
                    print("here")
                    event.save()
                    handle_event = getattr(self, "handle_U_" + args["type"])
                    result = handle_event(args, event, request=request)
                    serializer = EventSerializer(event)
                    return Response(serializer.data, status=result)
        return Response(status=400)

    def validate_PO(self, args):
        if "action":
            if args["action"] == "U":
                return self.validate_U(args)
            elif args["action"] == "MQ":
                return self.validate_MQ(args)
            elif args["action"] == "PL":
                return self.validate_PL(args)
        return False

    # GET
    def list(self, request):
        if "event_type" in request.query_params:
            event_type = request.query_params["event_type"]
        room_id = int(request.query_params["room"][0])
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
        if not set(request.data) <= {"room", "args", "event_type", "parent_event"}:
            return Response(status=400)
        try:
            room = Room.objects.get(pk=request.data["room"])
        except:
            return Response(status=400)
        event = Event(
            author=request.user,
            room=room,
            event_type=request.data["event_type"],
            args=request.data["args"],
        )
        if "parent_event" in request.data:
            parent_event = Event.objects.filter(pk=request.data["parent_event"])
            event.parent_event = parent_event
        handle_event = getattr(self, "handle_" + event.event_type)
        result = handle_event(request, event)
        return result


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
