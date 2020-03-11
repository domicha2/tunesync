from django.views.generic import TemplateView
from tunesync.models import Event, Room, Membership

from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.permissions import BasePermission
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import UserSerializer, MembershipSerializer

from django.db.models import F
from django.contrib.auth import authenticate, login

# https://stackoverflow.com/questions/47122471/how-to-set-a-method-in-django-rest-frameworks-viewset-to-not-require-authentica
# Can only set permissions for the entire viewset
# can change permission for a function if its NOT in a viewset
# have to create brand new permission set. this one seems fine.


class AnonCreateAndUpdateOwnerOnly(BasePermission):
    """
    Custom permission:
        - allow anonymous POST
        - allow authenticated GET and PUT on *own* record
        - allow all actions for staff
    """

    def has_permission(self, request, view):
        return view.action == "create" or request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return (
            view.action in ["retrieve", "update", "partial_update"]
            and obj.id == request.user.id
            or request.user.is_staff
        )


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
            login(request, user)
            return Response("")
        else:
            return Response("", status=401)

    @action(methods=["get"], detail=False)
    def whoami(self, request):
        """
        """
        return Response({"username": request.user.username})

    @action(detail=False, methods=["get"])
    def set_password(self, request, pk=None):
        return Response({"status": "password set"})


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
        room = Room(
            title=request.data["title"],
            subtitle=request.data["subtitle"],
            creator=request.user,
        )
        room.save()
        return Response(room.id)

    @action(methods=["get"], detail=True)
    def events(self, request, pk=None):
        # get all events at this room
        events = Event.objects.all().filter(
            room=pk).values().order_by('-creation_time')[:100]
        return Response(events)


class MembershipViewSet(viewsets.ModelViewSet):
    """
    Proof of concept viewset using ModelViewSet implementation
    Also, we need a membership viewset anyways
    """
    queryset = Membership.objects.all()
    serializer_class = MembershipSerializer
