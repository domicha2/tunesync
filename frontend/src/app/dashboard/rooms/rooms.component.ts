import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { AppState } from '../../app.module';
import { Room } from '../dashboard.models';
import { selectRooms } from '../store/dashboard.selectors';
import * as DashboardActions from '../store/dashboard.actions';

@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss'],
})
export class RoomsComponent implements OnInit, OnDestroy {
  subscription = new Subscription();

  rooms: { admin: Room[]; dj: Room[]; regular: Room[] };

  activeRoom: Room;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.store.select(selectRooms).subscribe((rooms: Room[]) => {
      this.rooms = {
        admin: rooms,
        dj: rooms,
        regular: rooms,
      };
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onRoomClick(room: Room): void {
    this.activeRoom = room;
    this.store.dispatch(DashboardActions.getUsersByRoom({ roomId: room.id }));
  }
}
