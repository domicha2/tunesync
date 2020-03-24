from rest_framework.permissions import BasePermission
from .models import Membership

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
        return (
            # TODO: get_data was added here temporarily for development, PLEASE REMOVE AFTER
            view.action in ["create", "auth", "get_data"]
            or request.user
            and request.user.is_authenticated
        )

    def has_object_permission(self, request, view, obj):
        return (
            view.action in ["retrieve", "update", "partial_update"]
            and obj.id == request.user.id
            or request.user.is_staff
        )


class InRoomOnlyEvents(BasePermission):
    """
    Users must be in the room to actually do anything 
    """

    def has_permission(self, request, view):
        if view.action == "list":
            if "room" in request.query_params:
                room_id = int(request.query_params["room"])
            else:
                return False
        else:
            if "room" in request.data:
                room_id = request.data["room"]
            else:
                return False
        return Membership.is_in_room(room_id, request.user)


def is_event_type(request, view, event):
    if view.action == "create":
        if "event_type" in request.data:
            event_type = request.data["event_type"]
        else:
            return False
        return event_type == event
    return False


class InRoomOnly(BasePermission):
    def has_permission(self, request, view):
        if view.action in {"tunesync", "events"}:
            room_id = view.kwargs["pk"]
            return Membership.is_in_room(room_id, request.user)
        return True


class DjOrAbove(BasePermission):
    """
    only DJ's or admins can post events of type T
    """

    def has_permission(self, request, view):
        if is_event_type(request, view, "T"):
            membership = Membership.get_membership(request.data["room"], request.user)
            return membership[0]["role"] == "A" or membership[0]["role"] == "D"
        return True


class RoomAdminOnly(BasePermission):
    def has_permission(self, request, view):
        if "room" in request.data:
            room_id = request.data["room"]
        else:
            return True
        if is_event_type(request, view, "U"):
            try:
                if request.data["args"]["type"] in {"C", "K"}:
                    return Membership.is_admin(room_id, request.user)
            except:
                return False
        return True


class JoinPendingOnly(BasePermission):
    def has_permission(self, request, view):
        if "room" in request.data:
            room_id = request.data["room"]
        else:
            return True
        if is_event_type(request, view, "U"):
            try:
                if request.data["args"]["type"] == "J":
                    state = Membership.get_membership(room_id, request.user)[0]["state"]
                    return state == "P"
            except:
                return False
        return True


class UploaderOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        return (
            view.action in ["destroy", "update", "partial_update"]
            and obj.uploader.id == request.user.id
        )
