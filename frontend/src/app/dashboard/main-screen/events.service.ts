import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { AppState } from '../../app.module';
import {
  AppEvent,
  EventType,
  PERSONAL_ROOM_NAME,
  PlayState,
  QueueState,
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
    private matSnackBar: MatSnackBar,
    private store: Store<AppState>,
    private notificationsService: NotificationsService,
  ) {}

  processTuneSyncEvent(tuneSyncEvent: TuneSyncEvent): void {
    let queue;
    let playEvent;
    // ! might have to relook at the null logic
    if (tuneSyncEvent.last_modify_queue === null) {
      this.store.dispatch(
        DashboardActions.storeQueue({
          queue: [],
        }),
      );
    } else {
      queue = (tuneSyncEvent.last_modify_queue as QueueState).queue.map(
        ([id, length, name]) => ({
          id,
          length,
          name,
        }),
      );
      this.store.dispatch(DashboardActions.storeQueue({ queue }));
    }
    if (tuneSyncEvent.last_play === null) {
      // no last play state
      this.store.dispatch(
        DashboardActions.setSongStatus({
          isPlaying: false,
          seekTime: 0,
          queueIndex: -1,
        }),
      );
    } else {
      playEvent = tuneSyncEvent.last_play as PlayState;
    }

    if (queue) {
      if (queue.length !== 0 && playEvent) {
        if (!playEvent.is_playing) {
          // EASY CASE
          this.store.dispatch(
            DashboardActions.setSongStatus({
              seekTime: playEvent.timestamp,
              isPlaying: false,
              queueIndex: playEvent.queue_index,
            }),
          );
          return;
        }

        // queue exists and something played before
        const playTimeStamp = moment(tuneSyncEvent.play_time);
        let difference = moment().diff(playTimeStamp, 'seconds', true);
        console.log('time since last play action', difference);

        let songIndex: number;
        for (let i = playEvent.queue_index; i < queue.length; i++) {
          if (i === playEvent.queue_index) {
            // first iteration only
            console.log('init differe', queue[i].length - playEvent.timestamp);
            if (queue[i].length - playEvent.timestamp < difference) {
              // remaining time in the first song can be subtracted
              difference -= queue[i].length - playEvent.timestamp;
            } else {
              console.log(
                'exiting after initial loop dispatch new queue index and dispatch new song status',
              );
              // stop here

              const seekTime = playEvent.timestamp + difference;
              console.log('finished in the first loop; seek at: ', seekTime);
              this.store.dispatch(
                DashboardActions.setSongStatus({
                  isPlaying: playEvent.is_playing,
                  seekTime,
                  queueIndex: playEvent.queue_index,
                }),
              );
              return;
            }
            // do need to execute logic below
            continue;
          }
          // find where the current song is in the queue and the timestamp to seek
          if (queue[i].length < difference) {
            difference -= queue[i].length;
          } else {
            songIndex = i;
            // use this time to seek to the current song
            const seekTime = difference;
            console.log('seek time: ', seekTime);

            this.store.dispatch(
              DashboardActions.setSongStatus({
                isPlaying: playEvent.is_playing,
                seekTime,
                queueIndex: songIndex,
              }),
            );
            // use this difference at that song index
            console.log('time remaining', difference, 'index', songIndex);
            return;
          }
        }

        if (songIndex === undefined) {
          this.store.dispatch(
            DashboardActions.setSongStatus({
              isPlaying: false,
              seekTime: queue[queue.length - 1].length,
              queueIndex: queue.length - 1,
            }),
          );
        }
      }
    }
  }

  processEvents(events: AppEvent[], roomName: string): AppEvent[] {
    let result = events
      .slice()
      .sort((eventA, eventB) =>
        new Date(eventA.creation_time) > new Date(eventB.creation_time)
          ? 1
          : -1,
      );

    result = result.filter((event) => {
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
    result = result.map((outerEvent) => {
      if (
        outerEvent.event_type === EventType.Messaging &&
        typeof outerEvent.args.is_accepted === 'boolean'
      ) {
        // look back for the join event
        const inviteEvent = result.find((innerEvent) => {
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
    result = result.filter((event) => !eventsToDelete.includes(event.event_id));
    return result;
  }

  processWebSocketMessage(
    event: AppEvent,
    roomId: number,
    roomName: string,
    events: AppEvent[],
  ): boolean {
    if (
      event.event_type === EventType.UserChange &&
      event.args.type === UserChangeAction.Kick &&
      typeof event.args.room === 'number'
    ) {
      // user got kicked need to update their rooms list
      // remove the room from the rooms list
      this.store.dispatch(DashboardActions.getRooms());
      // ! add the room name
      this.matSnackBar.open(
        'You got kicked from room ID: ' + event.args.room,
        undefined,
        {
          duration: 5000,
        },
      );

      // check if the user is also inside that room
      if (roomId === event.args.room) {
        this.store.dispatch(DashboardActions.resetState());
      }
    }

    if (event.room_id !== roomId) {
      // the associated room does not match the active room add a notification
      // TODO: consider what events should trigger a notification
      this.notificationsService.notificationsSubject.next({
        roomId: event.room_id,
        action: 'increment',
      });
      return false;
    }

    if (event.event_id) {
      // the associated room matches the active room continue
      switch (event.event_type) {
        case EventType.UserChange:
          this.processWSUserChangeEvent(event, events, roomName, roomId);
          break;
        case EventType.Messaging:
          this.processWSMessagingEvent(event, events);
          break;
        default:
          console.error('bad event type');
          break;
      }
      return true;
    }
  }

  private processWSUserChangeEvent(
    event: AppEvent,
    events: AppEvent[],
    roomName: string,
    roomId: number,
  ): void {
    if (roomName === PERSONAL_ROOM_NAME) {
      if (event.args.type === UserChangeAction.Invite) {
        events.push(event);
      } else {
        console.error('user change action from ws not supported yet');
      }
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
    } else if (event.args['type'] === UserChangeAction.Kick) {
      // everyone needs to update their users list
      this.store.dispatch(DashboardActions.getUsersByRoom({ roomId }));
    }
  }

  private processWSMessagingEvent(event: AppEvent, events: AppEvent[]): void {
    // the message might be for a join event
    if (
      event.event_type === EventType.Messaging &&
      typeof event.args.is_accepted === 'boolean'
    ) {
      // need to look for the invite event to delete and change the contents of the message
      const inviteEventIndex = events.findIndex(
        (innerEvent) => event.args.room === innerEvent.args.room_id,
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
  }
}
