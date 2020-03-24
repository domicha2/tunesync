import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AppState } from '../../../app.module';
import { User } from '../../dashboard.models';
import * as DashboardActions from '../../store/dashboard.actions';

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
      DashboardActions.removeUserFromRoom({ userId: this.user.userId }),
    );
  }
}
