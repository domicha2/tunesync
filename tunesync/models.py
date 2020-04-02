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

    def is_valid_parent(room, parent_event_id):
        """
        returns valid parent event. None otherwise
        """
        return Event.objects.filter(room=room, pk=parent_event_id)


class TuneSync(models.Model):
    event = models.OneToOneField(Event, on_delete=models.DO_NOTHING, primary_key=True)
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
            event_id = int(tunesync[0]["event_id"])
            tunesync = tunesync[0]["modify_queue"]
            tunesync["event_id"] = event_id
        else:
            tunesync = None
        result["last_modify_queue"] = tunesync
        tunesync = (
            TuneSync.objects.filter(event__room_id=pk, play__isnull=False)
            .order_by("-event__creation_time")
            .values()
        )
        if tunesync:
            event_id = int(tunesync[0]["event_id"])
            tunesync = tunesync[0]["play"]
            tunesync["event_id"] = event_id
            play_time = Event.objects.filter(pk=event_id).values()[0]["creation_time"]
        else:
            tunesync = None
        result["last_play"] = tunesync
        result["play_time"] = play_time
        result["room_id"] = pk
        return result


class Poll(models.Model):
    KICK = "K"
    MODIFY_QUEUE = "MQ"
    PLAY = "PL"
    ACTIONS = [(KICK, "Kick"), (MODIFY_QUEUE, "Modify Queue"), (PLAY, "Play")]
    # TODO:
    event = models.OneToOneField(Event, on_delete=models.DO_NOTHING, primary_key=True)
    action = models.CharField(max_length=2, choices=ACTIONS)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    creation_time = models.DateTimeField(auto_now_add=True)
    args = JSONField()
    is_actve = models.BooleanField(default=True)
    is_successful = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["room", "action", "creation_time"])]

    @property
    def vote_percentage(self):
        users = Membership.objects.filter(room=self.room)
        votes_agreed = Vote.objects.filter(poll=self, agree=True)
        if users:
            return len(votes_agreed) / len(users)
        else:
            return 0

    def is_majority(self):
        return self.vote_percentage > 0.5


class Vote(models.Model):
    event = models.OneToOneField(Event, on_delete=models.DO_NOTHING)
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    agree = models.BooleanField()

    class Meta:
        indexes = [models.Index(fields=["poll", "user"])]
        unique_together = ("poll", "user")


def hash_directory(instance, filename):
    return "tunes/{0}/{1}/{2}".format(
        instance.hash_value[0:2], instance.hash_value[2:4], instance.hash_value
    )


class Tune(models.Model):
    name = models.CharField(max_length=300)
    artist = models.CharField(max_length=300, blank=True)
    album = models.CharField(max_length=300, blank=True)
    uploader = models.ForeignKey(User, on_delete=models.CASCADE, blank=True)
    length = models.FloatField(blank=True, null=True)  # seconds
    mime = models.CharField(max_length=300, blank=True, null=True)
    audio_file = models.FileField(upload_to=hash_directory, null=True)
    hash_value = models.CharField(max_length=64)


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
        unique_together = ("room", "user")

    def get_membership(room_id, user):
        """
        room_id: int
        user: user instance
        """
        result = Membership.objects.filter(user=user, room_id=room_id).values()
        return result

    def is_admin(room_id, user):
        result = Membership.objects.filter(user=user, room_id=room_id).values()
        if result:
            return result[0]["role"] == "A"
        else:
            return False

    def is_in_room(room_id, user):
        membership = Membership.get_membership(room_id, user)
        if membership:
            return membership[0]["state"] == "P" or membership[0]["state"] == "A"
        else:
            return False


@receiver(post_save, sender=Event, dispatch_uid="update_event_listeners")
def update_event_listeners(sender, instance, **kwargs):
    """
    Alerts consumer of new events
    """
    if instance.event_type == "T":
        return

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

    room = instance.room
    users_in_room = Membership.objects.filter(room=room, state="A")
    for user in users_in_room:
        group_name = "user-{}".format(user.user_id)

        async_to_sync(channel_layer.group_send)(
            group_name, {"type": "user_notify_event", "text": message}
        )


@receiver(post_save, sender=TuneSync, dispatch_uid="update_tunesync_listeners")
def update_tunesync_listeners(sender, instance, **kwargs):
    room = instance.event.room

    tunesync = TuneSync.get_tune_sync(room.id)
    channel_layer = channels.layers.get_channel_layer()

    if "play_time" in tunesync and tunesync["play_time"] is not None:
        tunesync["play_time"] = tunesync["play_time"].isoformat()

    users_in_room = Membership.objects.filter(room=room, state="A")
    for user in users_in_room:
        group_name = "user-{}".format(user.user_id)
        async_to_sync(channel_layer.group_send)(
            group_name, {"type": "user_notify_event", "text": tunesync}
        )
    # need end point for websocket token
    # signed with hmacs
