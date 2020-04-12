import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppState } from '../app.module';
import {
  AppEvent,
  EventType,
  TuneSyncEvent,
  UserChangeAction,
} from './dashboard.models';
import { Poll } from './poll/poll.models';
import { getRooms } from './store/dashboard.actions';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private webSocket: WebSocket;
  messageSubject = new Subject<AppEvent>();
  pollsSubject = new Subject<Poll>();
  finishedPollsSubject = new Subject<Poll>();
  tuneSyncSubject = new Subject<TuneSyncEvent>();
  notificationsSubject = new Subject<AppEvent>();

  constructor(
    private store: Store<AppState>,
    private matSnackBar: MatSnackBar,
  ) {}

  /**
   * Set up the web socket connection using the token as authentication
   */
  createWebSocket(token: string): void {
    this.webSocket = new WebSocket(
      `${environment.webSocketUrl}?token=${token}`,
    );

    this.webSocket.onopen = (event: Event) => {};

    this.webSocket.onerror = (event: Event) => {};

    this.webSocket.onclose = (event: CloseEvent) => {};

    this.webSocket.onmessage = (event: MessageEvent) => {
      // parse the payload
      const payload: AppEvent | Poll | TuneSyncEvent = JSON.parse(event.data);

      // look at the event type to determine which subject to emit to
      switch (payload.event_type) {
        case EventType.CreatePoll:
          this.pollsSubject.next(payload as Poll);
          if (!(payload as Poll).is_active) {
            // if the poll is no longer active
            this.finishedPollsSubject.next(payload as Poll);
          }
          return;
        case EventType.TuneSync:
          this.tuneSyncSubject.next(payload as TuneSyncEvent);
          return;
        default:
          const appEvent: AppEvent = payload;
          if (
            appEvent.event_type === EventType.UserChange &&
            appEvent.args.type === UserChangeAction.Kick &&
            typeof appEvent.args.room === 'number'
          ) {
            // user got kicked need to update their rooms list
            // remove the room from the rooms list
            this.store.dispatch(getRooms());
            this.matSnackBar.open(
              'You got kicked out of ' + appEvent.args.room_name,
              undefined,
              {
                duration: 5000,
              },
            );
          }
          // alert subscribers that a new message was received
          this.messageSubject.next(payload as AppEvent);
          // alert dashboard component to potentially send notifications
          this.notificationsSubject.next(payload as AppEvent);
      }
    };
  }

  closeWebSocket(): void {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.close();
    }
  }
}
