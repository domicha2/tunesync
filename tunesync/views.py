from django.views.generic import TemplateView
from tunesync.models import Event

from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.response import Response
from .serializers import UserSerializer

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
        u = User.objects.create_user(username=request.data.username, password=request.data.password)
        u.save()
        return Response(u)

    # GET BY PK
    def retrieve(self, request, pk=None):
        pass

    # not sure
    def update(self, request, pk=None):
        pass

    # PATCH?
    def partial_update(self, request, pk=None):
        pass

    # DELETE
    def destroy(self, request, pk=None):
        pass
