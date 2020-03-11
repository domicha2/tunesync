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
    admin: [{ id: 1, name: 'Jim', role: Role.Admin }] as User[],
    dj: [{ id: 2, name: 'Alice', role: Role.DJ }] as User[],
    regular: [
      { id: 3, name: 'Bob', role: Role.Regular },
      { id: 4, name: 'David', role: Role.Regular },
    ] as User[],
  };

  constructor(private store: Store<AppState>, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.store.select(selectUsers).subscribe((users: User[]) => {
      console.log('users: ', users);
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
