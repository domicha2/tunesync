import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Store } from '@ngrx/store';

import { AppState } from '../../../app.module';
import * as DashboardActions from '../../store/dashboard.actions';
import { User } from '../../dashboard.models';

@Component({
  selector: 'app-kick-user',
  templateUrl: './kick-user.component.html',
  styleUrls: ['./kick-user.component.scss'],
})
export class KickUserComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public user: User,
    private store: Store<AppState>,
  ) {}

  onKick(): void {
    this.store.dispatch(
      DashboardActions.removeUserFromRoom({ userId: this.user.id }),
    );
    // call backend to remove user from this room
    console.log('kicked user' + this.user.name);
  }
}
