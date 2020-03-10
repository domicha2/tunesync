import { Component } from '@angular/core';

import { Store } from '@ngrx/store';

import { AppState } from '../../app.module';
import * as DashboardActions from '../store/dashboard.actions';

@Component({
  selector: 'app-messaging',
  templateUrl: './messaging.component.html',
  styleUrls: ['./messaging.component.scss'],
})
export class MessagingComponent {
  message = '';

  constructor(private store: Store<AppState>) {}

  onEnter(event: KeyboardEvent): void {
    this.store.dispatch(
      DashboardActions.createMessage({ message: this.message }),
    );
    this.message = '';
  }
}
