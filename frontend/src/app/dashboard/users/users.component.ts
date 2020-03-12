import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { KickUserComponent } from './kick-user/kick-user.component';
import { AppState } from '../../app.module';
import { selectUsers } from '../store/dashboard.selectors';
import { User, Role } from '../dashboard.models';

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

  constructor(private store: Store<AppState>, private dialog: MatDialog) {}

  ngOnInit(): void {
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
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onKickUser(user: User): void {
    this.dialog.open(KickUserComponent, {
      width: 'fit-content',
      data: user,
    });
  }

  drop(event: CdkDragDrop<string[]>): void {
    if (event.previousContainer === event.container) {
      // reorder list
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }
}
