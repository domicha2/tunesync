from background_task import background
from rest_framework import status
from .serializers import EventSerializer
from .models import Membership, Event, Room, Vote, Poll, TuneSync, Tune
from rest_framework.response import Response
from django.contrib.auth.models import User


class PollTask:
    @background(schedule=60)
    def initiate_poll(poll):
        poll = Poll.objects.get(pk=poll)
        if poll.is_majority():
            event = Event(
                room=poll.room, parent_event=poll.event, author=poll.event.author
            )
            args = poll.args
            execute = getattr(PollTask, "execute_" + poll.action)
            result = execute(args, event)
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

    def execute_PL(args, event):
        del args["action"]
        data = {"play": args}
        event.args = data
        event.event_type = "T"
        return Handler.handle_T(data, event, event.author)

    def execute_MQ(args, event):
        del args["action"]
        data = {"modify_queue": args}
        event.args = data
        event.event_type = "T"
        return Handler.handle_T(data, event, event.author)

    def execute_K(args, event):
        event.args = args
        event.event_type = "U"
        return Handler.handle_U(data, event, event.author)


class Handler:
    def validate_PL(args, event):
        if not (set(args.keys()) >= {"queue_index", "is_playing", "timestamp"}):
            return Response(
                {"details": "missing args"}, status=status.HTTP_400_BAD_REQUEST
            )
        if not Handler.validate_PL_argtypes(args):
            return Response(
                {"details": "args are bad types"}, status=status.HTTP_400_BAD_REQUEST
            )
        last_tunesync = TuneSync.get_tune_sync(event.room.id)
        if last_tunesync["last_modify_queue"]:
            queue = last_tunesync["last_modify_queue"]["queue"]
            if len(queue) - 1 < args["queue_index"] or args["queue_index"] < 0:
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

    def validate_PL_argtypes(args):
        return (
            isinstance(args["queue_index"], int)
            and isinstance(args["is_playing"], bool)
            and (
                isinstance(args["timestamp"], float)
                or isinstance(args["timestamp"], int)
            )
        )

    def validate_MQ(args, event):
        if "queue" in args:
            if not isinstance(args["queue"], list):
                return Response(
                    {"details": "args are bad types"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response(
                {"details": "missing args"}, status=status.HTTP_400_BAD_REQUEST
            )
        for song_id in args["queue"]:
            try:
                tune = Tune.objects.get(pk=song_id)
            except:
                return Response(
                    {"details": "song {} does not exist".format(song_id)},
                    status.HTTP_400_BAD_REQUEST,
                )
        return

    def handle_T(args, event, user, **kwargs):
        """
        Returns status code to use
        """
        event.save()
        tunesync = TuneSync(event_id=event.id)
        if "modify_queue" in args:
            handler_result = Handler.validate_MQ(args["modify_queue"], event)
            if handler_result:
                event.delete()
                return handler_result
            result = []
            for song_id in args["modify_queue"]["queue"]:
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
        if "play" in args:
            handler_result = Handler.validate_PL(args["play"], event)
            if handler_result:
                event.delete()
                return handler_result
            tunesync.play = args["play"]
        tunesync.save()
        result = TuneSync.get_tune_sync(event.room.id)
        return Response(result, status=status.HTTP_200_OK)

    def handle_M(args, event, **kw):
        """
        we just need to confirm that there is a content value in the payload
        """
        if "content" in args:
            if isinstance(args["content"], str):
                event.save()
                serializer = EventSerializer(event)
                return Response(serializer.data)
        return Response(
            {"details": "Incorrect content in args"}, status=status.HTTP_400_BAD_REQUEST
        )

    def handle_PO(args, event, **kw):
        """
        Handler for all types of polling:
        Play(PL), Kick(U), Modify Queue(MQ)
        """
        event_handler_result = Handler.validate_PO(args, event)
        if event_handler_result:
            return event_handler_result
        # save event to table
        event.save()
        # retrieve room the poll is happening in
        polling_room = event.room
        action_type = args["action"]
        # Check if the action is a kick, we want to store K
        if action_type == "U":
            action_type = "K"
        poll_event = Poll(event=event, action=action_type, room=polling_room, args=args)
        # save the poll and we're done
        poll_event.save()
        PollTask.initiate_poll(poll_event.event.id)
        serializer = EventSerializer(event)
        return Response(serializer.data)

    def handle_V(args, event, user, **kw):
        """
        Handler for the voting on any polls in a room
        """
        if not Handler.validate_V(args, event):
            return Response(
                {"details": "missing arguments"}, status=status.HTTP_400_BAD_REQUEST
            )
        # save event to Event table
        poll = Poll.objects.filter(event=event.parent_event)[0]
        if not poll.is_active:
            return Response(
                {"details": "This vote is already completed"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        event.save()
        agree_field = args["agree"]
        vote_event = Vote.objects.update_or_create(
            poll=poll, user=user, defaults={"event": event, "agree": agree_field}
        )
        # save the vote
        serializer = EventSerializer(event)
        return Response(serializer.data)

    def validate_V(args, event):
        if "agree" in args:
            return isinstance(args["agree"], bool)
        else:
            return False

    # TODO: This is ugly. Refractor into multiple functions if time allows

    def validate_U(args, event):
        event_type = args["type"]
        if event_type == "K":
            if "user" not in args:
                return Response(
                    {"details": "bad args"}, status=status.HTTP_400_BAD_REQUEST
                )
        elif event_type == "I":
            if "users" not in args:
                return Response(
                    {"details": "bad args"}, status=status.HTTP_400_BAD_REQUEST
                )
            if event.room.system_user:
                return Response(
                    {"details": "cannot invite others to personal room"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif event_type == "J":
            if "is_accepted" not in args:
                return Response(
                    {"details": "bad args"}, status=status.HTTP_400_BAD_REQUEST
                )
        elif event_type == "C":
            if set(args.keys()) != {"type", "user", "role"}:
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

    def handle_U_I(args, event, user, **kw):
        added_users = []
        for invited_user in args["users"]:
            try:
                system_room = Room.objects.get(system_user__id=invited_user)
            except:
                return (
                    {"details": "user {} does not exist".format(invited_user)},
                    status.HTTP_400_BAD_REQUEST,
                )
            u_obj = User.objects.get(pk=invited_user)
            membership = Membership.objects.filter(user=u_obj, room=event.room)
            if membership:
                return (
                    {"details": "user {} is already invited".format(invited_user)},
                    status.HTTP_400_BAD_REQUEST,
                )
            membership = Membership(room=event.room, user=u_obj, state="P", role="R")
            new_user = {"membership": membership, "system_room": system_room}
            added_users.append(new_user)
        for new_user in added_users:
            new_user["membership"].save()
            invite_event = Event(
                room=new_user["system_room"],
                author=user,
                event_type="U",
                args={
                    "type": "I",
                    "room_id": event.room.id,
                    "room_name": event.room.title,
                },
            )
            invite_event.save()
        return (None, status.HTTP_200_OK)

    def handle_U_J(args, event, user, **kw):
        system_room = Room.objects.get(system_user=user)
        if args["is_accepted"]:
            membership = Membership.objects.get(room=event.room, user=user)
            membership.state = "A"
        else:
            membership = Membership.objects.get(room=event.room, user=user)
            membership.state = "R"
        invite_event = Event.objects.filter(
            room=system_room, args__type="I", args__room_id=event.room.id
        ).order_by("-creation_date")
        invite_event.isDeleted = True
        invite_event.save()
        membership.save()
        return (None, status.HTTP_200_OK)

    def handle_U_K(args, event, user, **kw):
        kicked_user = Membership.objects.filter(room=event.room, user__id=args["user"])
        if not kicked_user:
            return ({"details": "user is not in the room"}, status.HTTP_400_BAD_REQUEST)
        system_room = Room.objects.get(system_user__id=args["user"])
        kick_event = Event(
            author=user,
            room=system_room,
            event_type="U",
            args={"type": "K", "room": event.room.id},
        )
        # let them know they've been kicked lol
        kick_event.save()
        # delete user from room
        kicked_user.delete()
        return (None, status.HTTP_200_OK)

    def handle_U_C(args, event, **kw):
        membership = Membership.objects.filter(user__id=args["user"], room=event.room)
        if not membership:
            return ({"details": "user is not in the room"}, status.HTTP_400_BAD_REQUEST)
        membership[0].role = args["role"]
        membership[0].save()
        return (None, status.HTTP_200_OK)

    def handle_U(args, event, user, **kw):
        if "type" in args:
            handler_result = Handler.validate_U(args, event)
            if handler_result:
                return handler_result
            handle_event = getattr(Handler, "handle_U_" + args["type"])
            result = handle_event(args, event, user=user)
            if result[1] >= 400:
                data = result[0]
            else:
                event.save()
                serializer = EventSerializer(event)
                data = serializer.data
            return Response(data, status=result[1])
        return Response(
            {"details": "Incorrect content in args"}, status=status.HTTP_400_BAD_REQUEST
        )

    def validate_PO(args, event):
        if "action":
            if args["action"] == "U":
                return Handler.validate_U(args, event)
            elif args["action"] == "MQ":
                return Handler.validate_MQ(args, event)
            elif args["action"] == "PL":
                return Handler.validate_PL(args, event)
        return Response(
            {"details": "Incorrect content in args"}, status=status.HTTP_400_BAD_REQUEST
        )
