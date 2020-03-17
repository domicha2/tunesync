from django.contrib.auth.models import User
from .models import Membership, Room, Event, Poll, Vote, Tune, TuneSync
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class MembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ["room", "user", "role"]


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ["id", "title", "subtitle", "creator", "members", "system_user"]


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "id",
            "room",
            "creation_time",
            "event_type",
            "author",
            "parent_event_id",
            "args",
            "isDeleted",
        ]


class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ["id", "user", "agree"]


class PollSerializer(serializers.ModelSerializer):
    class Meta:
        model = Poll
        fields = ["action", "room", "creation_time", "args"]


class TuneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tune
        fields = ["id", "uploader", "name", "artist", "album", "mime", "length"]
