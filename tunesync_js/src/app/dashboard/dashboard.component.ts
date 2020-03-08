import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  webSocket = new WebSocket('ws://localhost:8000/test/');

  ngOnInit() {
    this.setupSocket();
  }

  setupSocket() {
    this.webSocket.onopen = () => {
      console.log('websocket open');
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
