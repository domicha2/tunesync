import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from '../../../app.module';
import { User } from '../../../auth/auth.models';
import * as DashboardActions from '../../store/dashboard.actions';
import { selectActiveRoom } from '../../store/dashboard.selectors';

@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.scss'],
})
export class InviteComponent implements OnInit, OnDestroy {
  subscription = new Subscription();
  activeRoomId: number;

  selectedUsers: User[] = [];

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store
        .select(selectActiveRoom)
        .subscribe(roomId => (this.activeRoomId = roomId)),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onInvite(): void {
    this.store.dispatch(
      DashboardActions.createInviteUsersEvent({
        roomId: this.activeRoomId,
        users: this.selectedUsers.map(user => user.userId),
      }),
    );
  }
}
