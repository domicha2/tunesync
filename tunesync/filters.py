from django_filters.rest_framework import FilterSet
from .models import Tune
from django.contrib.auth.models import User
from rest_framework_filters import RelatedFilter


class UserFilter(FilterSet):
    class Meta:
        model = User
        fields = {"username": ["iexact", "exact"]}


class TuneFilter(FilterSet):

    uploader = RelatedFilter(
        UserFilter, field_name="uploader", query_set=User.objects.all()
    )

    class Meta:
        model = Tune
        fields = {
            "album": ["icontains", "contains", "exact", "iexact"],
            "artist": ["icontains", "contains", "exact", "iexact"],
            "name": ["icontains", "contains", "exact", "iexact"],
            "length": ["gt", "gte", "lt", "lte", "exact"],
        }

