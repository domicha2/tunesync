from rest_framework.permissions import BasePermission

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

