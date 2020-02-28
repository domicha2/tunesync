import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import { KickUserComponent } from './kick-user/kick-user.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent {
  users = {
    admin: ['Jim'],
    dj: ['Alice'],
    regular: ['Bob', 'David'],
  };

  constructor(private dialog: MatDialog) {}

  onKickUser(user): void {
    this.dialog.open(KickUserComponent, {
      width: 'fit-content',
      data: { user },
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
