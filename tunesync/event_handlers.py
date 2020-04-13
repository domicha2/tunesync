from background_task import background
from rest_framework import status
from .serializers import EventSerializer
from .models import Membership, Event, Room, Vote, Poll, TuneSync, Tune
from rest_framework.response import Response
from django.contrib.auth.models import User


def extract_song_ids(songs):
    result = []
    for item in songs:
        result.append(item[0])
    return result


class PollTask:
    def __init__(self, poll_id):
        self.poll_id = poll_id
        self.args = Poll.objects.get(pk=self.poll_id).args

    @staticmethod
    @background(schedule=60)
    def initiate_poll(poll_id):
        self = PollTask(poll_id)
        poll = Poll.objects.get(pk=self.poll_id)
        if poll.is_majority():
            event = Event(
                room=poll.room, parent_event=poll.event, author=poll.event.author
            )
            execute = getattr(self, "execute_" + poll.action)
            result = execute(event)
            if result.status_code == 200:
                poll.is_successful = True
            else:
                system_user = User.objects.get(pk=1)
                event = Event(
                    author=system_user,
                    room=poll.room,
                    parent_event=poll.event,
                    event_type="M",
                    args={
                        "content": "Failed due to: {}".format(result.data["details"])
                    },
                )
                event.save()
        poll.is_active = False
        poll.save()

    def execute_MQ(self, event):
        event.event_type = "T"
        ts = TuneSync.get_tune_sync(event.room.id)
        if ts["last_modify_queue"]:
            current_queue = extract_song_ids(ts["last_modify_queue"]["queue"])
            current_queue.append(self.args["song"])
        else:
            current_queue = [self.args["song"]]
        event.args = {"modify_queue": {"queue": current_queue}}
        handler = Handler(event, event.author)
        # the following is janky, not proud at all.
        poll = Poll.objects.get(pk=self.poll_id)
        return handler.handle_T()

    def execute_K(self, event):
        event.event_type = "U"
        event.args = {"user": self.args["user"], "type": "K"}
        handler = Handler(event, event.author)
        return handler.handle_U()


class Handler:
    def __init__(self, event, user, **kwargs):
        self.event = event
        self.user = user
        self.args = event.args  # just make it easier to access

    def validate_PL(self):
        if not (
            set(self.args["play"].keys()) >= {"queue_index", "is_playing", "timestamp"}
        ):
            return Response(
                {"details": "missing args"}, status=status.HTTP_400_BAD_REQUEST
            )
        if not self.validate_PL_argtypes():
            return Response(
                {"details": "args are bad types"}, status=status.HTTP_400_BAD_REQUEST
            )
        last_tunesync = TuneSync.get_tune_sync(self.event.room.id)
        if last_tunesync["last_modify_queue"]:
            queue = last_tunesync["last_modify_queue"]["queue"]
            if (
                len(queue) - 1 < self.args["play"]["queue_index"]
                or self.args["play"]["queue_index"] < 0
            ):
                return Response(
                    {"details": "Invalid song index for queue"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response(
                {"details": "There are no songs in queue to play"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return

    def validate_PL_argtypes(self):
        return (
            isinstance(self.args["play"]["queue_index"], int)
            and isinstance(self.args["play"]["is_playing"], bool)
            and (
                isinstance(self.args["play"]["timestamp"], float)
                or isinstance(self.args["play"]["timestamp"], int)
            )
        )

    def validate_MQ(self):
        if "queue" in self.args["modify_queue"]:
            if not isinstance(self.args["modify_queue"]["queue"], list):
                return Response(
                    {"details": "args are bad types"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response(
                {"details": "missing args"}, status=status.HTTP_400_BAD_REQUEST
            )
        for song_id in self.args["modify_queue"]["queue"]:
            try:
                tune = Tune.objects.get(pk=song_id)
            except:
                return Response(
                    {"details": "song {} does not exist".format(song_id)},
                    status.HTTP_400_BAD_REQUEST,
                )
        return

    def handle_T(self):
        """
        Returns status code to use
        """
        self.event.save()
        tunesync = TuneSync(event_id=self.event.id)
        if "modify_queue" in self.args:
            handler_result = self.validate_MQ()
            if handler_result:
                self.event.delete()
                return handler_result
            result = []
            for song_id in self.args["modify_queue"]["queue"]:
                try:
                    tune = Tune.objects.get(pk=song_id)
                    result.append([song_id, tune.length, tune.name])
                except:
                    event.delete()
                    return Response(
                        {"details": "song {} does not exist".format(song_id)},
                        status.HTTP_400_BAD_REQUEST,
                    )
            result = {"queue": result}
            tunesync.modify_queue = result
        if "play" in self.args:
            handler_result = self.validate_PL()
            if handler_result:
                self.event.delete()
                return handler_result
            tunesync.play = self.args["play"]
        tunesync.save()
        result = TuneSync.get_tune_sync(self.event.room.id)
        return Response(result, status=status.HTTP_200_OK)

    def handle_M(self):
        """
        we just need to confirm that there is a content value in the payload
        """
        if "content" in self.args:
            if isinstance(self.args["content"], str):
                self.event.save()
                serializer = EventSerializer(self.event)
                return Response(serializer.data)
        return Response(
            {"details": "Incorrect content in args"}, status=status.HTTP_400_BAD_REQUEST
        )

    def handle_PO(self):
        """
        Handler for all types of polling:
        Kick(U), Modify Queue(MQ)
        """
        event_handler_result = self.validate_PO()
        if event_handler_result:
            return event_handler_result
        # save event to table
        self.event.save()
        # retrieve room the poll is happening in
        polling_room = self.event.room
        action_type = self.args["action"]
        # Check if the action is a kick, we want to store K
        if action_type == "U":
            action_type = "K"
            self.args["username"] = User.objects.get(pk=self.args["user"]).username
        elif action_type == "MQ":
            song_id = self.args["song"]
            self.args["song_name"] = Tune.objects.get(pk=song_id).name
        poll_event = Poll(
            event=self.event, action=action_type, room=polling_room, args=self.args
        )
        # save the poll and we're done
        poll_event.save()
        PollTask.initiate_poll(poll_event.event.id)
        return Response(poll_event.get_state())

    def handle_V(self):
        """
        Handler for the voting on any polls in a room
        """
        if not self.validate_V():
            return Response(
                {"details": "missing arguments"}, status=status.HTTP_400_BAD_REQUEST
            )
        # save event to Event table
        poll = Poll.objects.filter(event=self.event.parent_event)
        if poll:
            poll = poll[0]
        else:
            return Response(
                {"details": "poll does not exist"}, status=status.HTTP_400_BAD_REQUEST
            )
        if not poll.is_active:
            return Response(
                {"details": "This vote is already completed"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        self.event.save()
        agree_field = self.args["agree"]
        vote_event = Vote.objects.update_or_create(
            poll=poll,
            user=self.user,
            defaults={"event": self.event, "agree": agree_field},
        )
        result = poll.get_state()
        return Response(poll.get_state())

    def validate_V(self):
        if "agree" in self.args:
            return isinstance(self.args["agree"], bool)
        else:
            return False

    def validate_U(self):
        event_type = self.args["type"]
        if event_type == "K":
            if "user" not in self.args:
                return Response(
                    {"details": "bad args"}, status=status.HTTP_400_BAD_REQUEST
                )
        elif event_type == "I":
            if "users" not in self.args:
                return Response(
                    {"details": "bad args"}, status=status.HTTP_400_BAD_REQUEST
                )
            if self.event.room.system_user:
                return Response(
                    {"details": "cannot invite others to personal room"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif event_type == "J":
            if "is_accepted" not in self.args:
                return Response(
                    {"details": "bad args"}, status=status.HTTP_400_BAD_REQUEST
                )
        elif event_type == "C":
            if set(self.args.keys()) != {"type", "user", "role"}:
                return Response(
                    {"details": "bad args"}, status=status.HTTP_400_BAD_REQUEST
                )
        elif event_type == "L":
            return
        else:
            return Response(
                {"details": "Invalid type"}, status=status.HTTP_400_BAD_REQUEST
            )
        return

    def handle_U_I(self):
        added_users = []
        for invited_user in self.args["users"]:
            try:
                system_room = Room.objects.get(system_user__id=invited_user)
            except:
                return (
                    {"details": "user {} does not exist".format(invited_user)},
                    status.HTTP_400_BAD_REQUEST,
                )
            u_obj = User.objects.get(pk=invited_user)
            membership = Membership.objects.filter(user=u_obj, room=self.event.room)
            if membership:
                return (
                    {"details": "user {} is already invited".format(invited_user)},
                    status.HTTP_400_BAD_REQUEST,
                )
            membership = Membership(
                room=self.event.room, user=u_obj, state="P", role="R"
            )
            new_user = {"membership": membership, "system_room": system_room}
            added_users.append(new_user)
        for new_user in added_users:
            new_user["membership"].save()
            invite_event = Event(
                room=new_user["system_room"],
                author=self.user,
                event_type="U",
                args={
                    "type": "I",
                    "room_id": self.event.room.id,
                    "room_name": self.event.room.title,
                },
            )
            invite_event.save()
        return (None, status.HTTP_200_OK)

    def handle_U_J(self):
        system_room = Room.objects.get(system_user=self.user)
        if self.args["is_accepted"]:
            membership = Membership.objects.get(room=self.event.room, user=self.user)
            membership.state = "A"
        else:
            membership = Membership.objects.get(room=self.event.room, user=self.user)
            membership.state = "R"
        invite_event = Event.objects.filter(
            room=system_room, args__type="I", args__room_id=self.event.room.id
        ).update(isDeleted=True)
        membership.save()
        return (None, status.HTTP_200_OK)

    def handle_U_K(self):
        kicked_user = Membership.objects.filter(
            room=self.event.room, user__id=self.args["user"]
        )
        if not kicked_user:
            return ({"details": "user is not in the room"}, status.HTTP_400_BAD_REQUEST)
        system_room = Room.objects.get(system_user__id=self.args["user"])
        kick_event = Event(
            author=self.user,
            room=system_room,
            event_type="U",
            args={
                "type": "K",
                "room": self.event.room.id,
                "room_name": self.event.room.title,
            },
        )
        # let them know they've been kicked lol
        kick_event.save()
        # delete user from room
        kicked_user.delete()
        return (None, status.HTTP_200_OK)

    def handle_U_C(self):
        membership = Membership.objects.filter(
            user__id=self.args["user"], room=self.event.room
        )
        if not membership:
            return ({"details": "user is not in the room"}, status.HTTP_400_BAD_REQUEST)
        membership[0].role = self.args["role"]
        membership[0].save()
        return (None, status.HTTP_200_OK)

    def handle_U(self):
        if "type" in self.args:
            handler_result = self.validate_U()
            if handler_result:
                return handler_result
            handle_event = getattr(self, "handle_U_" + self.args["type"])
            result = handle_event()
            if result[1] >= 400:
                data = result[0]
            else:
                self.event.save()
                serializer = EventSerializer(self.event)
                data = serializer.data
            return Response(data, status=result[1])
        return Response(
            {"details": "Incorrect content in args"}, status=status.HTTP_400_BAD_REQUEST
        )

    def validate_PO(self):
        if "action":
            if self.args["action"] == "U":
                return self.validate_U()
            elif self.args["action"] == "MQ":
                if "song" in self.args:
                    try:
                        tune = Tune.objects.get(pk=self.args["song"])
                    except:
                        return Response(
                            {"details": "not a valid song id"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    return
        return Response(
            {"details": "Incorrect content in args"}, status=status.HTTP_400_BAD_REQUEST
        )
