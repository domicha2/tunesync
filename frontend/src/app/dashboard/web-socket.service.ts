import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private webSocket: WebSocket;
  messageSubject: Subject<any> = new Subject();

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
      // alert subscribers that a new message was received
      this.messageSubject.next(event.data);
    };
  }

  closeWebSocket(): void {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.close();
    }
  }
}
