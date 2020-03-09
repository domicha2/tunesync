import { Component } from '@angular/core';
import { HttpWrapperService } from '../http-wrapper.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  webSocket = new WebSocket('ws://localhost:8000/test/');

  constructor(private httpWrapperService: HttpWrapperService) {}

  ngOnInit() {
    this.setupSocket();
  }

  setupSocket() {
    this.webSocket.onopen = () => {
      console.log('websocket open');
      this.httpWrapperService
        .post('/events/', {
          room_id: 1,
          author: 3,
          parent_event_id: null,
          args: 'asdfasdf',
          event_type: 'M',
        })
        .subscribe();
    };

    this.webSocket.onmessage = message => {
      console.log('received a message: ', message.data);
    };

    if (this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.onopen(null);
    }

    setTimeout(() => this.webSocket.send('hello from angular'), 1000);
  }
}
