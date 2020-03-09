import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import * as DashboardActions from './dashboard.actions';
import { QueueService } from '../queue/queue.service';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class DashboardEffects {
  getQueue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getQueue),
      switchMap(() =>
        this.queueService.getQueue().pipe(
          map((queuedSongs: DashboardActions.Song[]) => ({
            type: DashboardActions.storeQueue.type,
            queue: queuedSongs,
          })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  getAvailableSongs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getAvailableSongs),
      switchMap(() =>
        this.queueService.getAvailableSongs().pipe(
          map((availableSongs: DashboardActions.Song[]) => ({
            type: DashboardActions.storeAvailableSongs.type,
            availableSongs,
          })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  getRooms$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getRooms),
      switchMap(() =>
        this.roomsService.getRooms().pipe(
          map((rooms: DashboardActions.Room[]) => ({
            type: DashboardActions.storeRooms.type,
            rooms,
          })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  getUsersByRoom$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getUsersByRoom),
      switchMap(action =>
        this.usersService.getUsersByRoom(action.roomId).pipe(
          map((users: DashboardActions.User[]) => ({
            type: DashboardActions.storeUsers.type,
            users,
          })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  constructor(
    private actions$: Actions,
    private queueService: QueueService,
    private roomsService: RoomsService,
    private usersService: UsersService,
  ) {}
}
