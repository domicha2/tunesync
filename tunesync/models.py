from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import JSONField

# https://docs.djangoproject.com/en/3.0/ref/contrib/auth/#django.contrib.auth.models.User
# using default user class

import channels.layers
from asgiref.sync import async_to_sync

from django.db.models.signals import post_save
from django.dispatch import receiver


class Room(models.Model):
    title = models.CharField(max_length=30, blank=True)
    subtitle = models.CharField(max_length=30, blank=True, null=True)
    creator = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, related_name="creator"
    )
    creation_time = models.DateTimeField(auto_now_add=True)
    members = models.ManyToManyField(User, through="Membership")
    system_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        default=None,
        related_name="system_user",
    )

    class Meta:
        indexes = [models.Index(fields=["system_user"])]


class Event(models.Model):
    MESSAGE = "M"
    VOTE = "V"
    TUNESYNC = "T"
    POLL = "PO"
    USER_CHANGE = "U"
    EVENT_TYPE = [
        (POLL, "Poll"),
        (USER_CHANGE, "User Change"),
        (TUNESYNC, "Tune Sync"),
        (VOTE, "Vote"),
    ]
    isDeleted = models.BooleanField(default=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    creation_time = models.DateTimeField(auto_now_add=True)
    event_type = models.CharField(max_length=2, choices=EVENT_TYPE, default=MESSAGE)
    author = models.ForeignKey(User, on_delete=models.CASCADE, blank=True)
    parent_event = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE, default=None
    )
    args = JSONField()  # this will be a serialized json in a string

    class Meta:
        indexes = [models.Index(fields=["room", "event_type", "creation_time"])]


class TuneSync(models.Model):
    event = models.OneToOneField(Event, on_delete=models.CASCADE, primary_key=True)
    play = JSONField(null=True, blank=True)
    modify_queue = JSONField(null=True, blank=True)

    def get_tune_sync(pk):
        result = {}
        play_time = None
        tunesync = (
            TuneSync.objects.filter(event__room_id=pk, modify_queue__isnull=False)
            .order_by("-event__creation_time")
            .values()
        )
        if tunesync:
            tunesync = tunesync[0]
        else:
            tunesync = None
        result["last_modify_queue"] = tunesync
        tunesync = (
            TuneSync.objects.filter(event__room_id=pk)
            .order_by("-event__creation_time")
            .values()
        )
        if tunesync:
            tunesync = tunesync[0]
            play_time = Event.objects.filter(pk=tunesync["event_id"]).values()[0][
                "creation_time"
            ]
            result["play_time"] = play_time
        else:
            tunesync = None
            result["play_time"] = None
        result["last_play"] = tunesync


        return result


class Poll(models.Model):
    KICK = "K"
    MODIFY_QUEUE = "MQ"
    PLAY = "PL"
    ACTIONS = [(KICK, "Kick"), (MODIFY_QUEUE, "Modify Queue"), (PLAY, "Play")]
    # TODO:
    event = models.OneToOneField(Event, on_delete=models.CASCADE, primary_key=True)
    action = models.CharField(max_length=2, choices=ACTIONS)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    creation_time = models.DateTimeField(auto_now_add=True)
    args = JSONField()

    class Meta:
        indexes = [models.Index(fields=["room", "action", "creation_time"])]


class Vote(models.Model):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    agree = models.BooleanField()
    unique_together = ["poll", "user"]

    class Meta:
        indexes = [models.Index(fields=["poll", "user"])]


class Tune(models.Model):
    name = models.CharField(max_length=300)
    artist = models.CharField(max_length=300, blank=True)
    album = models.CharField(max_length=300, blank=True)
    uploader = models.ForeignKey(User, on_delete=models.CASCADE, blank=True)
    length = models.FloatField(blank=True, null=True)  # seconds
    mime = models.CharField(max_length=300, blank=True, null=True)
    audio_file = models.FileField(upload_to="tunes/", null=True)
    # need to add the file meta data stuff later


class Membership(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    unique_together = ["room", "user"]
    ACCEPTED = "A"
    PENDING = "P"
    REJECTED = "R"
    STATES = [(ACCEPTED, "Accepted"), (PENDING, "Pending"), (REJECTED, "Rejected")]
    state = models.CharField(max_length=1, choices=STATES, default=PENDING)
    DJ = "D"
    ADMIN = "A"
    REGULAR = "R"
    ROLES = [(DJ, "DJ"), (ADMIN, "Admin"), (REGULAR, "Regular")]
    role = models.CharField(max_length=1, choices=ROLES)

    class Meta:
        indexes = [models.Index(fields=["room", "user"])]


@receiver(post_save, sender=Event, dispatch_uid="update_event_listeners")
def update_event_listeners(sender, instance, **kwargs):
    """
    Alerts consumer of new events
    """
    if instance.event_type == "T":
        return

    room = instance.room
    group_name = "event-room-{}".format(room.id)

    message = {
        "room_id": instance.room.id,
        "event_id": instance.id,
        "event_type": instance.event_type,
        "user_id": instance.author.id,
        "parent_event_id": instance.parent_event_id,
        "creation_time": instance.creation_time.isoformat(),
        "args": instance.args,
        "username": instance.author.username,
    }

    channel_layer = channels.layers.get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        group_name, {"type": "user_notify_event", "text": message}
    )


@receiver(post_save, sender=TuneSync, dispatch_uid="update_tunesync_listeners")
def update_tunesync_listeners(sender, instance, **kwargs):
    room = instance.event.room.id

    tunesync = TuneSync.get_tune_sync(room)
    group_name = "event-room-{}".format(room)

    channel_layer = channels.layers.get_channel_layer()
    tunesync["play_time"] = tunesync["play_time"].isoformat()

    async_to_sync(channel_layer.group_send)(
        group_name, {"type": "user_notify_event", "text": tunesync}
    )
    # need end point for websocket token
    # signed with hmacs
