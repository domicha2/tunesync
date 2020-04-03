import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { AppState } from '../../app.module';
import { Role, User } from '../dashboard.models';
import * as DashboardActions from '../store/dashboard.actions';
import {
  selectActiveRoomName,
  selectUserRole,
  selectUsers,
} from '../store/dashboard.selectors';
import { InviteComponent } from './invite/invite.component';
import { KickUserComponent } from './kick-user/kick-user.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy {
  subscription = new Subscription();

  users = {
    admin: [] as User[],
    dj: [] as User[],
    regular: [] as User[],
  };

  userRole$: Observable<Role>;
  roomName$: Observable<string>;

  constructor(private store: Store<AppState>, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.roomName$ = this.store.select(selectActiveRoomName);
    this.userRole$ = this.store.select(selectUserRole);

    this.subscription.add(
      this.store.select(selectUsers).subscribe((users: User[]) => {
        // clear existing list of users
        this.users = {
          admin: [],
          dj: [],
          regular: [],
        };
        if (users) {
          // add users to their appropriate group
          users.forEach(user => {
            switch (user.role) {
              case Role.Admin:
                this.users.admin.push(user);
                break;
              case Role.DJ:
                this.users.dj.push(user);
                break;
              case Role.Regular:
                this.users.regular.push(user);
                break;
            }
          });
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onSignOut(): void {
    window.location.href = '/';
  }

  onKickUser(user: User): void {
    this.dialog.open(KickUserComponent, {
      width: 'fit-content',
      data: user,
    });
  }

  onInvite(): void {
    this.dialog.open(InviteComponent, {
      height: 'fit-content',
    });
  }

  /**
   * Calls endpoint to update a user's role
   * Must check that the user has admin permissions inside this room
   * Must check that the user is not demoting other admins
   */
  drop(event: CdkDragDrop<string[]>, role: 'A' | 'D' | 'R'): void {
    if (event.previousContainer === event.container) {
      // reorder list
      // ! this doesnt need to be a feature
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      // user got placed into a new group of users
      // validate that this action is okay
      const user = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      this.store.dispatch(
        DashboardActions.createRoleChangeEvent({
          userId: user['userId'],
          role,
        }),
      );
    }
  }
}
