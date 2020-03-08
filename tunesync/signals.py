import channels.layers
from asgiref.sync import async_to_sync

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Event

   # checks for every event at this point
    # https://stackoverflow.com/questions/46614541/using-django-signals-in-channels-consumer-classes
    @receiver(signals.post_save, sender=Event)

def send_message(event):
    '''
    Call back function to send message to the browser
    '''
    message = event['text'] + '\n'
    channel_layer = channels.layers.get_channel_layer()
    # Send message to WebSocket
    async_to_sync(channel_layer.send)(text_data=json.dumps(
        message
    ))


@receiver(post_save, sender=Event, dispatch_uid='update_event_listeners')
def update_event_listeners(sender, instance, **kwargs):
    '''
    Alerts consumer of new events
    '''

    user = instance.author
    group_name = 'event-user-{}'.format(user)

    message = {
        'event_id': instance.id,
        'event_type': instance.event_type,
        'author': instance.author,
        'creation_time': instance.creation_time.isoformat(),
        'args': instance.args,
    }

    channel_layer = channels.layers.get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'send_message',
            'text': message
        }
    )

    # need end point for websocket token
    # signed with hmacs 
    # 