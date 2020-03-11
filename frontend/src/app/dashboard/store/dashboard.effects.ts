import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, of } from 'rxjs';
import {
  map,
  switchMap,
  catchError,
  tap,
  withLatestFrom,
  concatMap,
} from 'rxjs/operators';

import * as DashboardActions from './dashboard.actions';
import { QueueService } from '../queue/queue.service';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';
import { Song, Room, User, AppEvent } from '../dashboard.models';
import { MessagingService } from '../messaging/messaging.service';
import { AppState } from '../../app.module';
import { Store, select } from '@ngrx/store';
import { selectUserAndRoom } from '../../app.selectors';
import { MainScreenService } from '../main-screen/main-screen.service';
import { selectActiveRoom } from './dashboard.selectors';
import { selectUserId } from '../../auth/auth.selectors';

@Injectable()
export class DashboardEffects {
  getQueue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getQueue),
      switchMap(() =>
        this.queueService.getQueue().pipe(
          map((queuedSongs: Song[]) => ({
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
          map((availableSongs: Song[]) => ({
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
      concatMap(action =>
        of(action).pipe(withLatestFrom(this.store.pipe(select(selectUserId)))),
      ),
      switchMap(([action, userId]) =>
        this.roomsService.getRooms(userId).pipe(
          map((rooms: Room[]) => ({
            type: DashboardActions.storeRooms.type,
            rooms,
          })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  addRoom$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DashboardActions.createRoom),
        switchMap(action =>
          this.roomsService.createRoom(action.room).pipe(
            tap(response => console.log(response)),
            catchError(() => EMPTY),
          ),
        ),
      ),
    { dispatch: false },
  );

  getUsersByRoom$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getUsersByRoom),
      switchMap(action =>
        this.usersService.getUsersByRoom(action.roomId).pipe(
          map((users: User[]) => ({
            type: DashboardActions.storeUsers.type,
            users,
          })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  removeUserFromRoom$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DashboardActions.removeUserFromRoom),
        concatMap(action =>
          of(action).pipe(
            withLatestFrom(this.store.pipe(select(selectActiveRoom))),
          ),
        ),
        switchMap(([action, roomId]) =>
          this.usersService.removeUserFromRoom(roomId, action.userId).pipe(
            tap(response => console.log(response)),
            catchError(() => EMPTY),
          ),
        ),
      ),
    { dispatch: false },
  );

  getEventsByRoom$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getEventsByRoom),
      switchMap(action =>
        this.mainScreenService.getEventsByRoom(action.roomId).pipe(
          map((events: AppEvent[]) => ({
            type: DashboardActions.storeEvents.type,
            events,
          })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  createMessage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DashboardActions.createMessage),
        concatMap(action =>
          of(action).pipe(
            withLatestFrom(this.store.pipe(select(selectUserAndRoom))),
          ),
        ),
        tap(([action, userAndRoom]) => console.log(action, userAndRoom)),
        switchMap(([action, userAndRoom]) =>
          this.messagingService
            .createMessage({
              content: action.message,
              userId: userAndRoom.userId,
              roomId: userAndRoom.roomId,
            })
            .pipe(
              tap(response => console.log('message response:' + response)),
              catchError(() => EMPTY),
            ),
        ),
      ),
    { dispatch: false },
  );

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private queueService: QueueService,
    private roomsService: RoomsService,
    private usersService: UsersService,
    private messagingService: MessagingService,
    private mainScreenService: MainScreenService,
  ) {}
}
