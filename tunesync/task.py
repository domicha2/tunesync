from background_task import background


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
