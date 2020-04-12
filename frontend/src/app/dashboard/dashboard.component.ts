import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatDialogState,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { isUndefined } from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { filter, skip, withLatestFrom } from 'rxjs/operators';
import { AppState } from '../app.module';
import { selectUserId } from '../auth/auth.selectors';
import {
  AppEvent,
  EventType,
  Role,
  UserChangeAction,
} from './dashboard.models';
import { NotificationsService } from './notifications.service';
import { CreatePollComponent } from './poll/create-poll/create-poll.component';
import { PollsViewerComponent } from './poll/polls-viewer/polls-viewer.component';
import { getRooms } from './store/dashboard.actions';
import { selectActiveRoom, selectUserRole } from './store/dashboard.selectors';
import { WebSocketService } from './web-socket.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  subscription = new Subscription();
  activeRoom$: Observable<number>;
  userRole$: Observable<Role>;

  pollsViewerDialogRef: MatDialogRef<PollsViewerComponent>;

  constructor(
    private matSnackBar: MatSnackBar,
    private notificationsService: NotificationsService,
    private webSocketService: WebSocketService,
    private matDialog: MatDialog,
    private title: Title,
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.title.setTitle('TuneSync');

    this.activeRoom$ = this.store.select(selectActiveRoom);
    this.userRole$ = this.store.select(selectUserRole);

    this.subscription.add(
      this.webSocketService.notificationsSubject
        .pipe(withLatestFrom(this.activeRoom$, this.store.select(selectUserId)))
        .subscribe(([appEvent, activeRoom, userId]) => {
          this.handleUserRoleChange(appEvent, activeRoom, userId);

          // the associated room does not match the active room add a notification
          // TODO: consider what events should trigger a notification
          if (activeRoom !== appEvent.room_id) {
            this.notificationsService.notificationsSubject.next({
              roomId: appEvent.room_id,
              action: 'increment',
            });
          }
        }),
    );

    this.subscription.add(
      this.activeRoom$
        .pipe(
          skip(1),
          filter(isUndefined),
        )
        .subscribe(() => {
          // skip the first time active room is undefined because that is the default
          // whenever the active room is cleared (user got kicked)
          if (
            this.pollsViewerDialogRef &&
            this.pollsViewerDialogRef.getState() === MatDialogState.OPEN
          ) {
            this.pollsViewerDialogRef.close();
          }
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  handleUserRoleChange(
    appEvent: AppEvent,
    activeRoom: number,
    userId: number,
  ): void {
    // check if the event is a user change of type C event
    // then check if the user id matches the current user
    // if so need to update their rooms list
    if (
      appEvent.event_type === EventType.UserChange &&
      appEvent.args.type === UserChangeAction.RoleChange &&
      appEvent.args.user === userId
    ) {
      this.store.dispatch(getRooms());
      let snackBarMessage: string;
      if (activeRoom === appEvent.room_id) {
        // the user is already in the room in which their role changed
        if (appEvent.args.role === Role.DJ) {
          snackBarMessage = 'You got promoted to DJ!';
        } else if (appEvent.args.role === Role.Regular) {
          snackBarMessage = 'You got demoted to a regular user!';
        }
      } else {
        if (appEvent.args.role === Role.DJ) {
          snackBarMessage = 'You got promoted to DJ in a room!';
        } else if (appEvent.args.role === Role.Regular) {
          snackBarMessage = 'You got demoted to a regular user in a room!';
        }
      }
      this.matSnackBar.open(snackBarMessage, undefined, {
        duration: 5000,
      });
    }
  }

  openCreatePollDialog(): void {
    this.matDialog.open(CreatePollComponent, {
      width: '75%',
      height: 'fit-content',
    });
  }

  openPollsViewerDialog(): void {
    this.pollsViewerDialogRef = this.matDialog.open(PollsViewerComponent, {
      width: '75%',
      height: '85%',
    });
  }
}
