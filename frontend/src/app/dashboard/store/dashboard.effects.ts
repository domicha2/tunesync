import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { EMPTY, of } from 'rxjs';
import {
  catchError,
  concatMap,
  map,
  mergeMap,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { AppState } from '../../app.module';
import { selectUserAndRoom } from '../../app.selectors';
import { selectUserId } from '../../auth/auth.selectors';
import { ControlsService } from '../controls/controls.service';
import {
  AppEvent,
  Room,
  SYSTEM_USER_ID,
  User,
  PERSONAL_ROOM_NAME,
} from '../dashboard.models';
import { MainScreenService } from '../main-screen/main-screen.service';
import { MessagingService } from '../messaging/messaging.service';
import { PollService } from '../poll/poll.service';
import { QueueService } from '../queue/queue.service';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';
import * as DashboardActions from './dashboard.actions';
import {
  selectActiveRoom,
  selectQueueIndexAndRoom,
  selectUsers,
} from './dashboard.selectors';
import { Poll } from '../poll/poll.models';
import { getPageFromURL } from '../../utility';

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
        ),
      ),
    { dispatch: false },
  );

  getAvailableSongs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getAvailableSongs),
      switchMap(action =>
        this.queueService.getAvailableSongs(action.filters, action.page).pipe(
          tap(response => {
            this.queueService.availSongsPrevNextSubject.next({
              prev: getPageFromURL(response.previous),
              next: getPageFromURL(response.next),
            });
          }),
          map(response => ({
            type: DashboardActions.storeAvailableSongs.type,
            availableSongs: response.results,
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
            rooms: rooms.sort((a, b) => {
              if (a.title === PERSONAL_ROOM_NAME) {
                return -1;
              } else if (b.title === PERSONAL_ROOM_NAME) {
                return 1;
              } else {
                return a.title < b.title ? -1 : 1;
              }
            }),
          })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  getUsersByRoom$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getUsersByRoom),
      concatMap(action =>
        of(action).pipe(withLatestFrom(this.store.pipe(select(selectUserId)))),
      ),
      switchMap(([action, userId]) =>
        this.usersService.getUsersByRoom(action.roomId).pipe(
          mergeMap((users: User[]) => {
            const userRole = users.find(user => user.userId === userId).role;
            return [
              { type: DashboardActions.storeUsers.type, users },
              { type: DashboardActions.setUserRole.type, userRole },
            ];
          }),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  getPollsByRoom$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getPollsByRoom),
      withLatestFrom(this.store.select(selectActiveRoom)),
      switchMap(([action, roomId]) =>
        this.pollService.getPollsByRoom(roomId).pipe(
          map(response => ({
            type: DashboardActions.setPolls.type,
            polls: response.results as Poll[],
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
        this.mainScreenService
          .getEventsByRoom(action.roomId, action.creationTime)
          .pipe(
            map(response => ({
              type: DashboardActions.storeEvents.type,
              events: response.results,
              loadMore: response.next !== null,
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
          this.controlsService.createTunes(action.tunes).pipe(
            tap(response => {
              // emit a snackbar event
              this.controlsService.songsUploaded.next(response.length);
            }),
            catchError(() => {
              this.controlsService.songsUploaded.next(0);
              return EMPTY;
            }),
          ),
        ),
      ),
    { dispatch: false },
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
        switchMap(([action, room]) =>
          this.usersService.removeUserFromRoom(room, action.userId),
        ),
      ),
    { dispatch: false },
  );

  createPoll$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DashboardActions.createPoll),
        withLatestFrom(this.store.select(selectActiveRoom)),
        switchMap(([action, room]) =>
          this.pollService
            .createPoll(room, action.pollArgs)
            .pipe(catchError(() => EMPTY)),
        ),
      ),
    { dispatch: false },
  );

  createVote$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DashboardActions.createVote),
        withLatestFrom(this.store.select(selectActiveRoom)),
        switchMap(([action, room]) =>
          this.pollService.createVote(room, action.pollId, action.agree).pipe(
            catchError(() => EMPTY),
          ),
        ),
      ),
    { dispatch: false },
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
        switchMap(([action, userAndRoom]) =>
          this.messagingService
            .createMessage({
              content: action.message,
              userId: userAndRoom.userId,
              roomId: userAndRoom.roomId,
            })
            .pipe(
              catchError(() => EMPTY),
            ),
        ),
      ),
    { dispatch: false },
  );

  getUsersByUsername$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getUsersByUsername),
      withLatestFrom(
        this.store.select(selectUserId),
        this.store.select(selectUsers),
      ),
      switchMap(([action, userId, roomUsers]) =>
        this.usersService.getUsersByUsername(action.username, action.page).pipe(
          tap(response => {
            this.usersService.usersPrevNextSubject.next({
              prev: getPageFromURL(response.previous),
              next: getPageFromURL(response.next),
            });
          }),
          map(response => ({
            type: DashboardActions.storeAllUsers.type,
            allUsers: response.results
              .filter(resUser => {
                if (resUser.id === SYSTEM_USER_ID) {
                  return false;
                }
                if (action.filterByActiveRoom === false) {
                  // do not want to filter because we are creating new room
                  // however we should filter out the the current user
                  return resUser.id !== userId;
                } else {
                  // check that the user is not already in the room
                  return (
                    roomUsers.find(
                      roomUser => roomUser.userId === resUser.id,
                    ) === undefined
                  );
                }
              })
              .map(user => ({
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
        switchMap(([action, data]) =>
          this.controlsService
            .createPlaySongEvent(data.room, data.index, action.timestamp)
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
        switchMap(([action, data]) =>
          this.controlsService
            .createPauseSongEvent(data.room, data.index, action.timestamp)
        ),
      ),
    { dispatch: false },
  );

  createInviteResponseEvent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.createInviteResponseEvent),
      switchMap(action =>
        this.usersService
          .createInviteResponseEvent(action.roomId, action.response)
          .pipe(map(() => ({ type: DashboardActions.getRooms.type }))),
      ),
    ),
  );

  createRoleChangeEvent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.createRoleChangeEvent),
      concatMap(action =>
        of(action).pipe(
          withLatestFrom(this.store.pipe(select(selectActiveRoom))),
        ),
      ),
      switchMap(([action, roomId]) =>
        this.usersService
          .createRoleChangeEvent(action.userId, roomId, action.role)
          .pipe(
            map(() => ({ type: DashboardActions.getUsersByRoom.type, roomId })),
          ),
      ),
    ),
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
    private pollService: PollService,
  ) {}
}
