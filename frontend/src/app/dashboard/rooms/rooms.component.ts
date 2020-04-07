import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppState } from '../../app.module';
import { Role, Room } from '../dashboard.models';
import { NotificationsService } from '../notifications.service';
import * as DashboardActions from '../store/dashboard.actions';
import { selectRooms } from '../store/dashboard.selectors';
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

  notifications: { [roomId: number]: number } = {};

  constructor(
    private notificationsService: NotificationsService,
    private store: Store<AppState>,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.notificationsService.notificationsSubject.subscribe((payload) => {
      if (payload.action === 'reset') {
        // undefined makes it so that it does not render
        this.notifications[payload.roomId] = undefined;
      } else if (payload.action === 'increment') {
        if (this.notifications[payload.roomId] === undefined) {
          this.notifications[payload.roomId] = 1;
        } else {
          this.notifications[payload.roomId]++;
        }
      }
    });

    this.store
      .select(selectRooms)
      .pipe(filter((rooms) => rooms !== undefined))
      .subscribe((rooms: Room[]) => {
        // clear existing value
        this.rooms = { admin: [], dj: [], regular: [] };

        rooms.forEach((room) => {
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
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onRoomClick(room: Room): void {
    // prevent users from triggering a refresh when clicking same room
    // Why? there is no need the data is the same and is a hit in performance
    if (this.activeRoom && room.id === this.activeRoom.id) return;

    this.activeRoom = room;
    this.store.dispatch(DashboardActions.resetState());
    this.store.dispatch(
      DashboardActions.setActiveRoom({
        activeRoomId: room.id,
        activeRoomName: room.title,
      }),
    );
    this.notificationsService.notificationsSubject.next({
      roomId: room.id,
      action: 'reset',
    });
    this.store.dispatch(DashboardActions.getUsersByRoom({ roomId: room.id }));
    this.store.dispatch(
      DashboardActions.getEventsByRoom({
        roomId: room.id,
        creationTime: new Date(),
      }),
    );
    this.store.dispatch(DashboardActions.getTuneSyncEvent({ roomId: room.id }));
  }

  onAddRoom(): void {
    // open modal
    this.dialog.open(AddRoomComponent);
  }
}
