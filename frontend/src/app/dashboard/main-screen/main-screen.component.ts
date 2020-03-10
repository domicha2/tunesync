import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { environment } from '../../../environments/environment';
import { AppState } from '../../app.module';
import { selectEvents, selectActiveRoom } from '../store/dashboard.selectors';
import { AppEvent } from '../dashboard.models';

@Component({
  selector: 'app-main-screen',
  templateUrl: './main-screen.component.html',
  styleUrls: ['./main-screen.component.scss'],
})
export class MainScreenComponent implements OnInit, OnDestroy {
  subscription = new Subscription();
  events: AppEvent[] = [];
  webSocket: WebSocket;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store.select(selectActiveRoom).subscribe((roomId: number) => {
        this.createWebSocket(roomId);
      }),
    );

    // get a list of events
    this.subscription.add(
      this.store.select(selectEvents).subscribe((events: AppEvent[]) => {
        console.log(events);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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
        const data = JSON.parse(messageEvent.data);
        const event: AppEvent = {
          eventId: data.event_id,
          userId: data.author,
          roomId: data.room_id,
          parentEventId: data.parent_event_id,
          eventType: data.event_type,
          args: data.args,
          creationTime: data.creation_time,
        };
        if (event.eventId) this.events.push(event);
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
