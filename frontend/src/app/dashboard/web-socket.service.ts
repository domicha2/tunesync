import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { EventType, AppEvent, TuneSyncEvent } from './dashboard.models';
import { Poll } from './poll/poll.models';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private webSocket: WebSocket;
  messageSubject = new Subject<AppEvent>();
  pollsSubject = new Subject<Poll>();
  tuneSyncSubject = new Subject<TuneSyncEvent>();

  /**
   * Set up the web socket connection using the token as authentication
   */
  createWebSocket(token: string): void {
    this.webSocket = new WebSocket(
      `${environment.webSocketUrl}?token=${token}`,
    );

    this.webSocket.onopen = (event: Event) => {
      console.log('connected to web socket');
    };

    this.webSocket.onerror = (event: Event) => {
      console.log('there was an error with the websocket');
    };

    this.webSocket.onclose = (event: CloseEvent) => {
      console.log('disconnected from web socket');
    };

    this.webSocket.onmessage = (event: MessageEvent) => {
      // parse the payload
      const payload: AppEvent | Poll | TuneSyncEvent = JSON.parse(event.data);
      console.log('websocket payload', payload);

      // look at the event type to determine which subject to emit to
      switch (payload.event_type) {
        case EventType.CreatePoll:
          this.pollsSubject.next(payload as Poll);
          return;
        case EventType.TuneSync:
          this.tuneSyncSubject.next(payload as TuneSyncEvent);
          return;
        default:
          // alert subscribers that a new message was received
          this.messageSubject.next(payload as AppEvent);
      }
    };
  }

  closeWebSocket(): void {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.close();
    }
  }
}
