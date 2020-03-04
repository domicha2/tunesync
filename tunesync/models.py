from django.db import models
from django.contrib.auth.models import User

# https://docs.djangoproject.com/en/3.0/ref/contrib/auth/#django.contrib.auth.models.User
# using default user class


class Event(models.Model):
    MESSAGE = "M"
    VOTE = "V"
    KICK = "K"
    JOIN = "J"
    LEAVE = "L"
    MODIFY_QUEUE = "MQ"
    SKIP = "SP"
    PAUSE = "P"
    SEEK = "SK"
    PLAY = "PL"
    EVENT_TYPE = [
        (MESSAGE, "Message"),
        (VOTE, "Vote"),
        (KICK, "Kick"),
        (JOIN, "Join"),
        (LEAVE, "Leave"),
        (MODIFY_QUEUE, "Modify Queue"),
        (SKIP, "Skip"),
        (PAUSE, "Pause"),
        (SEEK, "Seek"),
        (PLAY, "Play"),
    ]
    creation_time = models.DateTimeField(auto_now_add=True)
    event_type = models.CharField(max_length=2, choices=EVENT_TYPE, default=MESSAGE)
    author = models.ForeignKey(User)
    parent_event_id = models.ForeignKey("self", null=True, on_delete=models.CASCADE)
    args = models.CharField(
        max_length=10000
    )  # this will be a serialized json in a string


class Room(models.Model):
    title = models.CharField(max_length=30)
    subtitle = models.CharField(max_length=30)
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    creation_time = models.DateTimeField(auto_now_add=True)


class Vote(models.Model):
    KICK = "K"
    MODIFY_QUEUE = "MQ"
    SKIP = "SP"
    PAUSE = "P"
    SEEK = "SK"
    PLAY = "PL"
    ACTIONS = [
        (KICK, "Kick"),
        (MODIFY_QUEUE, "Modify Queue"),
        (SKIP, "Skip"),
        (PAUSE, "Pause"),
        (SEEK, "Seek"),
        (PLAY, "Play"),
    ]
    action = models.CharField(max_length=2, choices=ACTIONS)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    creation_time = models.DateTimeField(auto_now_add=True)
    args = models.CharField(max_length=10000)


class Votes(models.Model):
    vote_id = models.ForeignKey(Vote, on_delete=models.CASCADE)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    agree = models.BooleanField()


class Tunes(models.Model):
    name = models.CharField(max_length=30)
    artist = models.CharField(max_length=30)
    album = models.CharField(max_length=30)
    # need to add the file meta data stuff later


class UserIn(models.Model):
    room_id = models.ForeignKey(Room, on_delete=models.CASCADE)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    ACCEPTED = "A"
    PENDING = "P"
    REJECTED = "R"
    STATES = [(ACCEPTED, "Accepted"), (PENDING, "Pending"), (REJECTED, "Rejected")]
    state = models.CharField(max_length=1, choices=STATES)
    DJ = "D"
    ADMIN = "A"
    OTHER = "O"
    ROLES = [(DJ, "DJ"), (ADMIN, "Admin"), (OTHER, "Other")]
    role = models.CharField(max_length=1, choices=ROLES)
