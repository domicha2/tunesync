from django.contrib.auth.models import User
from .models import Membership, Room, Event, Poll, Vote, Tune
from rest_framework import serializers


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ["url", "username", "email", "groups"]


class MembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ["room", "user", "role"]


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ["title", "subtitle", "creator", "members"]


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "room",
            "creation_time",
            "event_type",
            "author",
            "parent_event_id",
            "args",
        ]


class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ["user", "agree"]


class PollSerializer(serializers.ModelSerializer):
    class Meta:
        model = Poll
        fields = ["id", "action", "room", "creation_time", "args"]


class TuneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tune
        fields = ["name", "artist", "album"]
