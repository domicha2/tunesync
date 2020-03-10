import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { environment } from '../../../environments/environment';
import { AppState } from '../../app.module';
import { selectEvents } from '../store/dashboard.selectors';
import { AppEvent } from '../dashboard.models';

@Component({
  selector: 'app-main-screen',
  templateUrl: './main-screen.component.html',
  styleUrls: ['./main-screen.component.scss'],
})
export class MainScreenComponent implements OnInit, OnDestroy {
  subscription = new Subscription();
  events: any[] = [];

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    const webSocket = new WebSocket(environment.webSocketUrl);

    webSocket.onopen = (event: Event) => {
      console.log('connected to web socket');
    };

    webSocket.onmessage = (messageEvent: MessageEvent) => {
      console.log('received a message', messageEvent);
      // TODO: take action based on the data from the event
      // TODO: could update the view or not
      this.events.push(messageEvent.data);
    };

    webSocket.onerror = (event: Event) => {
      console.log('there was an error with the websocket');
    };

    webSocket.onclose = (closedEvent: CloseEvent) => {
      console.log('disconnected from web socket');
    };

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
}
