import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatDialogState,
} from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { isUndefined } from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { filter, skip, tap, withLatestFrom } from 'rxjs/operators';
import { AppState } from '../app.module';
import { AppEvent, Role } from './dashboard.models';
import { NotificationsService } from './notifications.service';
import { CreatePollComponent } from './poll/create-poll/create-poll.component';
import { PollsViewerComponent } from './poll/polls-viewer/polls-viewer.component';
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
        .pipe(withLatestFrom(this.activeRoom$))
        .subscribe(([appEvent, activeRoom]) => {
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
      this.activeRoom$.pipe(skip(1), filter(isUndefined)).subscribe(() => {
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
