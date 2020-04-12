import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatDialogState,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { isUndefined } from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppState } from '../../app.module';
import { Role, User } from '../dashboard.models';
import * as DashboardActions from '../store/dashboard.actions';
import {
  selectActiveRoom,
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
  isDarkTheme = true;

  users = {
    admin: [] as User[],
    dj: [] as User[],
    regular: [] as User[],
  };

  userRole$: Observable<Role>;
  roomName$: Observable<string>;

  inviteDialogRef: MatDialogRef<InviteComponent>;

  constructor(private store: Store<AppState>, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store
        .select(selectActiveRoom)
        .pipe(filter(isUndefined))
        .subscribe(() => {
          if (
            this.inviteDialogRef &&
            this.inviteDialogRef.getState() === MatDialogState.OPEN
          ) {
            this.inviteDialogRef.close();
          }
        }),
    );

    this.roomName$ = this.store.select(selectActiveRoomName);
    this.userRole$ = this.store.select(selectUserRole);

    this.subscription.add(
      this.store
        .select(selectUsers)
        .pipe(filter(users => users !== undefined))
        .subscribe((users: User[]) => {
          // clear existing list of users
          this.users = {
            admin: [],
            dj: [],
            regular: [],
          };

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
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onToggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    if (this.isDarkTheme) {
      document.querySelector('body').classList.remove('light-theme');
    } else {
      document.querySelector('body').classList.add('light-theme');
    }
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
    this.inviteDialogRef = this.dialog.open(InviteComponent, {
      height: 'fit-content',
      width: '30%',
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

  /**
   * Used in the ngFor for each room's list
   */
  trackByUserId(index: number, item: User): number {
    return item.userId;
  }
}
