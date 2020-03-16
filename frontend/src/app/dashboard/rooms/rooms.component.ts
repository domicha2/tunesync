import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { AppState } from '../../app.module';
import { Room, Role } from '../dashboard.models';
import { selectRooms } from '../store/dashboard.selectors';
import * as DashboardActions from '../store/dashboard.actions';
import { AddRoomComponent } from './add-room/add-room.component';

@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss'],
})
export class RoomsComponent implements OnInit, OnDestroy {
  subscription = new Subscription();

  rooms: { admin: Room[]; dj: Room[]; regular: Room[] } = {
    admin: [],
    dj: [],
    regular: [],
  };

  activeRoom: Room;

  constructor(private store: Store<AppState>, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.store.select(selectRooms).subscribe((rooms: Room[]) => {
      // clear existing value
      this.rooms = { admin: [], dj: [], regular: [] };
      if (rooms) {
        rooms.forEach(room => {
          switch (room.role) {
            case Role.Admin:
              this.rooms.admin.push(room);
              break;
            case Role.DJ:
              this.rooms.dj.push(room);
              break;
            case Role.Regular:
              this.rooms.regular.push(room);
              break;
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onRoomClick(room: Room): void {
    this.activeRoom = room;
    this.store.dispatch(
      DashboardActions.setActiveRoom({ activeRoomId: room.id }),
    );
    this.store.dispatch(DashboardActions.getUsersByRoom({ roomId: room.id }));
    this.store.dispatch(DashboardActions.getEventsByRoom({ roomId: room.id }));
    this.store.dispatch(DashboardActions.getTuneSyncEvent({ roomId: room.id }));
  }

  onAddRoom(): void {
    this.store.dispatch(DashboardActions.getAllUsers());
    // open modal
    this.dialog.open(AddRoomComponent);
  }
}
