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
  mergeMap,
} from 'rxjs/operators';

import * as DashboardActions from './dashboard.actions';
import { QueueService } from '../queue/queue.service';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';
import { Song, Room, User, AppEvent } from '../dashboard.models';
import { User as AuthUser } from '../../auth/auth.models';
import { MessagingService } from '../messaging/messaging.service';
import { AppState } from '../../app.module';
import { Store, select } from '@ngrx/store';
import { selectUserAndRoom } from '../../app.selectors';
import { MainScreenService } from '../main-screen/main-screen.service';
import {
  selectActiveRoom,
  selectQueueIndexAndRoom,
} from './dashboard.selectors';
import { selectUserId } from '../../auth/auth.selectors';
import { ControlsService } from '../controls/controls.service';

@Injectable()
export class DashboardEffects {
  createModifyQueueEvent$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DashboardActions.createModifyQueueEvent),
        concatMap(action =>
          of(action).pipe(
            withLatestFrom(this.store.pipe(select(selectActiveRoom))),
          ),
        ),
        switchMap(([action, roomId]) =>
          this.queueService
            .createModifyQueueEvent(action.queue, roomId)
            .pipe(tap(response => console.log(response))),
        ),
      ),
    { dispatch: false },
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

  getTuneSyncEvent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getTuneSyncEvent),
      switchMap(action =>
        this.roomsService.getTuneSyncEvent(action.roomId).pipe(
          map(response => ({
            type: DashboardActions.setTuneSyncEvent.type,
            tuneSyncEvent: response,
          })),
        ),
      ),
    ),
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

  createTunes$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DashboardActions.createTunes),
        switchMap(action =>
          this.controlsService
            .createTunes(action.tunes)
            .pipe(
              tap(response => console.log('create tunes response: ', response)),
            ),
        ),
      ),
    { dispatch: false },
  );

  removeUserFromRoom$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.removeUserFromRoom),
      concatMap(action =>
        of(action).pipe(
          withLatestFrom(this.store.pipe(select(selectActiveRoom))),
        ),
      ),
      switchMap(([action, room]) =>
        this.usersService.removeUserFromRoom(room, action.userId).pipe(
          tap(response => console.log(response)),
          map(response => ({
            type: DashboardActions.getUsersByRoom.type,
            roomId: room,
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

  getAllUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getAllUsers),
      switchMap(() =>
        this.usersService.getAllUsers().pipe(
          map((users: any[]) => ({
            type: DashboardActions.storeAllUsers.type,
            allUsers: users.map(user => ({
              username: user.username,
              userId: user.id,
            })),
          })),
        ),
      ),
    ),
  );

  addRoom$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.createRoom),
      switchMap(action =>
        this.roomsService.createRoom(action.room).pipe(
          mergeMap(response => {
            if (action.users === null || action.users.length === 0) {
              return [{ type: DashboardActions.getRooms.type }];
            }
            return [
              {
                type: DashboardActions.createInviteUsersEvent.type,
                users: action.users,
                roomId: response.id,
              },
              { type: DashboardActions.getRooms.type },
            ];
          }),
        ),
      ),
    ),
  );

  createInviteUsersEvent$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DashboardActions.createInviteUsersEvent),
        switchMap(action =>
          this.usersService
            .createInviteUsersEvent(action.users, action.roomId)
            .pipe(tap(response => console.log(response))),
        ),
      ),
    { dispatch: false },
  );

  /* Controls Effects */
  createChangeSongEvent$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          DashboardActions.createPreviousSongEvent,
          DashboardActions.createNextSongEvent,
        ),
        concatMap(action =>
          of(action).pipe(
            withLatestFrom(this.store.pipe(select(selectQueueIndexAndRoom))),
          ),
        ),
        switchMap(([action, data]) =>
          this.controlsService
            .createSeekSongEvent(
              data.room,
              action.queueIndex,
              action.timestamp,
              action.isPlaying,
            )
            .pipe(tap(response => console.log('change song res: ', response))),
        ),
      ),
    { dispatch: false },
  );

  createSeekSongEvent$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          DashboardActions.createForwardSongEvent,
          DashboardActions.createReplaySongEvent,
        ),
        concatMap(action =>
          of(action).pipe(
            withLatestFrom(this.store.pipe(select(selectQueueIndexAndRoom))),
          ),
        ),
        switchMap(([action, data]) =>
          this.controlsService
            .createSeekSongEvent(
              data.room,
              data.index,
              action.timestamp,
              action.isPlaying,
            )
            .pipe(tap(response => console.log('seek song: ', response))),
        ),
      ),
    { dispatch: false },
  );

  createPlaySongEvent$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DashboardActions.createPlaySongEvent),
        concatMap(action =>
          of(action).pipe(
            withLatestFrom(this.store.pipe(select(selectQueueIndexAndRoom))),
          ),
        ),
        tap(data => console.log(data)),
        switchMap(([action, data]) =>
          this.controlsService
            .createPlaySongEvent(data.room, data.index, action.timestamp)
            .pipe(tap(response => console.log(response))),
        ),
      ),
    { dispatch: false },
  );

  createPauseSongEvent$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DashboardActions.createPauseSongEvent),
        concatMap(action =>
          of(action).pipe(
            withLatestFrom(this.store.pipe(select(selectQueueIndexAndRoom))),
          ),
        ),
        tap(data => console.log('in the pause song effect')),
        switchMap(([action, data]) =>
          this.controlsService
            .createPauseSongEvent(data.room, data.index, action.timestamp)
            .pipe(tap(response => console.log(response))),
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
    private controlsService: ControlsService,
  ) {}
}
