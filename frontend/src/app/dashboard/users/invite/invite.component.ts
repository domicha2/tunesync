import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subscription, Observable } from 'rxjs';
import { AppState } from '../../../app.module';
import { User } from '../../../auth/auth.models';
import * as DashboardActions from '../../store/dashboard.actions';
import {
  selectActiveRoom,
  selectAllUsers,
} from '../../store/dashboard.selectors';

@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.scss'],
})
export class InviteComponent implements OnInit, OnDestroy {
  subscription = new Subscription();
  users = new FormControl();
  activeRoomId: number;
  allUsers$: Observable<User[]>;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store
        .select(selectActiveRoom)
        .subscribe(roomId => (this.activeRoomId = roomId)),
    );

    this.allUsers$ = this.store.select(selectAllUsers);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onInvite(): void {
    this.store.dispatch(
      DashboardActions.createInviteUsersEvent({
        roomId: this.activeRoomId,
        users: this.users.value,
      }),
    );
  }
}
