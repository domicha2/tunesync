from django_filters.rest_framework import FilterSet
from .models import Tune, Room, Event
from django.contrib.auth.models import User
from rest_framework_filters.filters import RelatedFilter


class UserFilter(FilterSet):
    class Meta:
        model = User
        fields = {"username": ["icontains", "exact"]}


class TuneFilter(FilterSet):
    class Meta:
        model = Tune
        fields = {
            "album": ["icontains", "contains", "exact", "iexact"],
            "artist": ["icontains", "contains", "exact", "iexact"],
            "name": ["icontains", "contains", "exact", "iexact"],
            "length": ["gt", "gte", "lt", "lte", "exact"],
        }


class EventFilter(FilterSet):

    # RelatedFilter
    class Meta:
        model = Event
        fields = {
            "id": ["iexact", "exact"],
            "creation_time": ["lt"],
            "event_type": ["exact"],
        }
