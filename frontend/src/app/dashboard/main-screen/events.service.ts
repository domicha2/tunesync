import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../app.module';
import {
  AppEvent,
  EventType,
  PERSONAL_ROOM_NAME,
  TuneSyncEvent,
  UserChangeAction,
} from '../dashboard.models';
import { NotificationsService } from '../notifications.service';
import * as DashboardActions from '../store/dashboard.actions';

@Injectable({
  // ? can change this later if only MainScreenComponent uses it
  providedIn: 'root',
})
export class EventsService {
  constructor(
    private store: Store<AppState>,
    private notificationsService: NotificationsService,
  ) {}

  processEvents(events: AppEvent[], roomName: string): AppEvent[] {
    let result = events.sort((eventA, eventB) =>
      new Date(eventA.creation_time) > new Date(eventB.creation_time) ? 1 : -1,
    );

    result = result.filter(event => {
      // ? revisit user change events (join/kick/role change to be displayed)
      if (
        roomName !== PERSONAL_ROOM_NAME &&
        event.event_type === EventType.UserChange
      ) {
        return false;
      } else if (event.event_type === EventType.TuneSync) {
        return false;
      } else {
        return true;
      }
    });
    // iterate through all events looking for join events (event type: 'M" and args : {is_accepted: boolean})
    // if found event remove invitation event with a meaningful message about the join event
    const eventsToDelete = [];
    result = result.map(outerEvent => {
      if (
        outerEvent.event_type === EventType.Messaging &&
        typeof outerEvent.args.is_accepted === 'boolean'
      ) {
        // look back for the join event
        const inviteEvent = result.find(innerEvent => {
          return (
            innerEvent.event_type === EventType.UserChange &&
            innerEvent.args.type === UserChangeAction.Invite &&
            outerEvent.args.room === innerEvent.args.room_id
          );
        });
        eventsToDelete.push(inviteEvent.event_id);
        const message = `You have ${
          outerEvent.args.is_accepted ? 'accepted' : 'rejected'
        } the invite to ${inviteEvent.args.room_name} from ${
          inviteEvent.username
        }`;
        const newJoinEvent: AppEvent = {
          ...outerEvent,
          args: {
            content: message,
          },
        };
        return newJoinEvent;
      } else {
        // keep the event the same since it is not the join event
        return outerEvent;
      }
    });

    // filter events
    result = result.filter(event => !eventsToDelete.includes(event.event_id));
    return result;
  }

  processWebSocketMessage(
    data,
    roomId: number,
    roomName: string,
    events: AppEvent[],
  ): boolean {
    const event: AppEvent = JSON.parse(data);
    console.log('payload from websocket: ', event);
    if (event.room_id !== roomId) {
      // the associated room does not match the active room add a notification
      // TODO: consider what events should trigger a notification
      this.notificationsService.notificationsSubject.next({
        roomId: event.room_id,
        action: 'increment',
      });
      return false;
    }
    if (event.event_id || event['last_modify_queue']) {
      // the associated room matches the active room continue
      switch (event.event_type) {
        // ? this is a TUNESYNC EVENT
        case undefined:
          // determine what type of event it was
          // if it is playing the dispatch set song stat
          // if it is modifying the queue, need to dispatch a new queue
          const tuneSyncEvent = {
            last_modify_queue: event['last_modify_queue'],
            last_play: event['last_play'],
            play_time: event['play_time'],
          } as TuneSyncEvent;
          if (
            tuneSyncEvent.last_play === null ||
            tuneSyncEvent.last_modify_queue.event_id >
              tuneSyncEvent.last_play.event_id
          ) {
            // the  DJ made a modify queue event
            // need to dispatch new queue into my store
            this.store.dispatch(
              DashboardActions.storeQueue({
                queue: tuneSyncEvent.last_modify_queue.queue.map(
                  ([id, length, name]) => ({ id, length, name }),
                ),
              }),
            );
          } else {
            // the DJ made a play event
            // ! could have race condition but handleTuneSync function has the same design
            this.store.dispatch(
              DashboardActions.setSongStatus({
                isPlaying: tuneSyncEvent.last_play.is_playing,
                seekTime: tuneSyncEvent.last_play.timestamp,
                queueIndex: tuneSyncEvent.last_play.queue_index,
              }),
            );
          }
          break;
        case EventType.UserChange:
          if (roomName === PERSONAL_ROOM_NAME) {
            events.push(event);
          } else if (event.args['type'] === UserChangeAction.RoleChange) {
            this.store.dispatch(DashboardActions.getUsersByRoom({ roomId }));
          } else if (event.args['type'] === UserChangeAction.Join) {
            if (event.args.is_accepted === true) {
              // need to update the users list to show the new user
              this.store.dispatch(DashboardActions.getUsersByRoom({ roomId }));

              // ? convert the event to a message event for cosmetic effects
              event.event_type = EventType.Messaging;
              event.args.content = 'joined the room';
              events.push(event);
            }
          }
          break;
        case EventType.Messaging:
          // the message might be for a join event
          if (
            event.event_type === EventType.Messaging &&
            typeof event.args.is_accepted === 'boolean'
          ) {
            // need to look for the invite event to delete and change the contents of the message
            const inviteEventIndex = events.findIndex(
              innerEvent => event.args.room === innerEvent.args.room_id,
            );
            const inviteEvent = events[inviteEventIndex];
            const message = `You have ${
              event.args.is_accepted ? 'accepted' : 'rejected'
            } the invite to ${inviteEvent.args.room_name} from ${
              inviteEvent.username
            }`;
            const newJoinEvent: AppEvent = {
              ...event,
              args: {
                content: message,
              },
            };
            events.push(newJoinEvent);

            // need to remove the invite event from the list of events
            events.splice(inviteEventIndex, 1);
          } else {
            events.push(event);
          }

          break;
        default:
          console.error('bad event type');
          break;
      }
      return true;

    }
  }
}
