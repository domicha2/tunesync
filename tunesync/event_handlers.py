from background_task import background
from rest_framework import status
from .serializers import EventSerializer
from .models import Membership, Event, Room, Vote, Poll, TuneSync, Tune
from rest_framework.response import Response
from django.contrib.auth.models import User


class PollTask:
    @background(schedule=60)
    def initiate_poll(poll):
        if poll.is_majority():
            event = Event(room=room, parent_event=poll.event, author=poll.event.author)
            args = poll.args
            del args["action"]
            event.args = args
            event.save()
        poll.is_active = False
        poll.save()


class Handler:
    def validate_PL(args):
        if set(args.keys()) >= {"queue_index", "is_playing", "timestamp"}:
            return (
                isinstance(args["queue_index"], int)
                and isinstance(args["is_playing"], bool)
                and (
                    isinstance(args["timestamp"], float)
                    or isinstance(args["timestamp"], int)
                )
            )
        else:
            return False

    def validate_MQ(args):
        if "queue" in args:
            return isinstance(args["queue"], list)
        else:
            return False

    def handle_T(data, event, user, **kwargs):
        """
        Returns status code to use
        """
        event.save()
        tunesync = TuneSync(event_id=event.id)
        args = data["args"]
        if "modify_queue" in args:
            if not Handler.validate_MQ(args["modify_queue"]):
                event.delete()
                return Response(
                    {"details": "Incorrect content in args"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
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
            if not Handler.validate_PL(args["play"]):
                event.delete()
                return Response(
                    {"details": "Incorrect content in args"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            last_tunesync = TuneSync.get_tune_sync(event.room.id)
            if last_tunesync["last_modify_queue"]:
                queue = last_tunesync["last_modify_queue"]["queue"]
                if (
                    len(queue) - 1 < args["play"]["queue_index"]
                    or args["play"]["queue_index"] < 0
                ):
                    event.delete()
                    return Response(
                        {"details": "Invalid song index for queue"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                event.delete()
                return Response(
                    {"details": "There are no songs in queue to play"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            tunesync.play = args["play"]
        tunesync.save()
        result = TuneSync.get_tune_sync(event.room.id)
        return Response(result, status=status.HTTP_200_OK)

    def handle_M(data, event, **kw):
        """
        we just need to confirm that there is a content value in the payload
        """
        args = data["args"]
        if "content" in args:
            if isinstance(args["content"], str):
                event.save()
                serializer = EventSerializer(event)
                return Response(serializer.data)
        return Response(
            {"details": "Incorrect content in args"}, status=status.HTTP_400_BAD_REQUEST
        )

    def handle_PO(data, event, **kw):
        """
        Handler for all types of polling:
        Play(PL), Kick(U), Modify Queue(MQ)
        """
        args = data["args"]
        if not Handler.validate_PO(args):
            print("Improper polling request")
            return Response(status=400)
        # save event to table
        event.save()
        # retrieve room the poll is happening in
        polling_room = event.room
        action_type = args["action"]
        # Check if the action is a kick, we want to store K
        if action_type == "U":
            action_type = "K"
        poll_event = Poll(
            event=event,
            action=action_type,
            room=polling_room,
            # not sure what i have to put in here?
            # roomId so we know where to have the poll?
            args={"room_id": polling_room.id, "room_name": polling_room.title},
        )
        # save the poll and we're done
        poll_event.save()
        return Response(status=200)

    def handle_V(data, event, user, **kw):
        """
        Handler for the voting on any polls in a room
        """
        args = data["args"]
        if not Handler.validate_V(args):
            print("Improper vote format")
            return Response(status=400)
        # save event to Event table
        event.save()
        agree_field = args["agree"]
        poll = Poll.objects.filter(event_id=data["parent_event"])[0]
        vote_event = Vote(event=event, poll=poll, user=user, agree=agree_field)
        # save the vote
        vote_event.save()
        return Response(status=200)

    def validate_V(args):
        if "agree" in args:
            return isinstance(args["agree"], bool)
        else:
            return False

    # TODO: This is ugly. Refractor into multiple functions if time allows

    def validate_U(args):
        event_type = args["type"]
        if event_type == "K":
            return "user" in args
        elif event_type == "I":
            return "users" in args
        elif event_type == "J":
            return "is_accepted" in args
        elif event_type == "C":
            return set(args.keys()) == {"type", "user", "role"}
        else:
            return True
        return False

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
        if args["is_accepted"]:
            membership = Membership.objects.get(room=event.room, user=user)
            membership.state = "A"
            membership.save()
        else:
            membership = Membership.objects.get(room=event.room, user=user)
            membership.state = "R"
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

    def handle_U(data, event, user, **kw):
        print(type(user))
        args = data["args"]
        if "type" in args:
            if args["type"] in {"K", "I", "J", "L", "C"}:
                if Handler.validate_U(args):
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

    def validate_PO(args):
        if "action":
            if args["action"] == "U":
                return Handler.validate_U(args)
            elif args["action"] == "MQ":
                return Handler.validate_MQ(args)
            elif args["action"] == "PL":
                return Handler.validate_PL(args)
        return False
