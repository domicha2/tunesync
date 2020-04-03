import { Injectable } from '@angular/core';
import {
  AppEvent,
  EventType,
  PERSONAL_ROOM_NAME,
  UserChangeAction,
} from '../dashboard.models';

@Injectable({
  // ? can change this later if only MainScreenComponent uses it
  providedIn: 'root',
})
export class EventsService {
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
}
