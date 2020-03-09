import { Component, OnInit } from '@angular/core';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-main-screen',
  templateUrl: './main-screen.component.html',
  styleUrls: ['./main-screen.component.scss'],
})
export class MainScreenComponent implements OnInit {
  events: any[] = [];

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
  }
}
