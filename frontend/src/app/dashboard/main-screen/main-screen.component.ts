import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { environment } from '../../../environments/environment';
import { AppState } from '../../app.module';
import { selectEvents, selectActiveRoom } from '../store/dashboard.selectors';
import {
  AppEvent,
  EventType,
  ModifyQueueEvent,
  PlayEvent,
} from '../dashboard.models';
import { selectUserId } from '../../auth/auth.selectors';
import * as DashboardActions from '../store/dashboard.actions';
import { distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-screen',
  templateUrl: './main-screen.component.html',
  styleUrls: ['./main-screen.component.scss'],
})
export class MainScreenComponent implements OnInit, OnDestroy {
  subscription = new Subscription();
  events: AppEvent[] = [];
  webSocket: WebSocket;
  userId: number;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store.select(selectUserId).subscribe((userId: number) => {
        this.userId = userId;
      }),
    );

    this.subscription.add(
      this.store.select(selectActiveRoom).subscribe((roomId: number) => {
        this.createWebSocket(roomId);
      }),
    );

    // get a list of events
    this.subscription.add(
      this.store
        .select(selectEvents)
        .pipe(
          filter(events => events !== undefined && events !== null),
          distinctUntilChanged(
            (prev, curr) =>
              prev[0] && curr[0] && prev[0].room_id === curr[0].room_id,
          ),
        )
        .subscribe((events: AppEvent[]) => {
          this.handleEventsResponse(events);
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  handleEventsResponse(events: AppEvent[]): void {
    const modifyQueueEvent = events.find(
      event => event.event_type === EventType.ModifyQueue,
    );
    if (modifyQueueEvent) {
      const queue: ModifyQueueEvent = modifyQueueEvent.args;
      this.store.dispatch(DashboardActions.storeQueue(queue));
    }

    this.events = events.sort((eventA, eventB) =>
      new Date(eventA.creation_time) > new Date(eventB.creation_time) ? 1 : -1,
    );
    setTimeout(() => {
      const el = document.querySelector('mat-list-item:last-child');
      if (el) {
        el.scrollIntoView();
      }
    }, 500);
  }

  createWebSocket(roomId: number): void {
    // check if room id has been set
    if (roomId !== undefined) {
      // check if there is already a connection
      if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
        // clear connection
        this.webSocket.close();
      }

      this.webSocket = new WebSocket(
        `${environment.webSocketUrl}?room_id=${roomId}`,
      );

      this.webSocket.onopen = (event: Event) => {
        console.log('connected to web socket');
      };

      this.webSocket.onmessage = (messageEvent: MessageEvent) => {
        console.log('received a message', messageEvent);
        // TODO: take action based on the data from the event
        // TODO: could update the view or not
        const event: AppEvent = JSON.parse(messageEvent.data);
        if (event.event_id) {
          switch (event.event_type) {
            case EventType.ModifyQueue:
              const queue: ModifyQueueEvent = event.args;
              this.store.dispatch(DashboardActions.storeQueue(queue));
              break;
            case EventType.Messaging:
              break;
            case EventType.Play:
              // if we just got a play event we could either be playing or pausing the song
              const payload: PlayEvent = event.args;
              if (payload.isPlaying) {
                // play the song
                this.store.dispatch(
                  DashboardActions.setSongStatus({ isPlaying: true }),
                );
              } else {
                // pause the song
                this.store.dispatch(
                  DashboardActions.setSongStatus({ isPlaying: false }),
                );
              }
              break;
            default:
              console.error('bad event type');
              break;
          }
          this.events.push(event);
          setTimeout(
            () =>
              document
                .querySelector('mat-list-item:last-child')
                .scrollIntoView(),
            500,
          );
        }
      };

      this.webSocket.onerror = (event: Event) => {
        console.log('there was an error with the websocket');
      };

      this.webSocket.onclose = (closedEvent: CloseEvent) => {
        console.log('disconnected from web socket');
      };
    }
  }
}
