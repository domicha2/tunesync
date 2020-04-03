import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { AppState } from '../../app.module';
import { selectUserId } from '../../auth/auth.selectors';
import { AppEvent, TuneSyncEvent } from '../dashboard.models';
import * as DashboardActions from '../store/dashboard.actions';
import {
  selectActiveRoom,
  selectActiveRoomName,
  selectEvents,
  selectTuneSyncEvent,
} from '../store/dashboard.selectors';
import { WebSocketService } from '../web-socket.service';
import { EventsService } from './events.service';

@Component({
  selector: 'app-main-screen',
  templateUrl: './main-screen.component.html',
  styleUrls: ['./main-screen.component.scss'],
})
export class MainScreenComponent implements OnInit, OnDestroy {
  subscription = new Subscription();
  events: AppEvent[] = [];
  userId: number;
  activeRoomName: string;
  activeRoomId: number;

  showLoadMore = false;

  constructor(
    private eventsService: EventsService,
    private webSocketService: WebSocketService,
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.webSocketService.messageSubject.subscribe(messageData => {
      const updateView: boolean = this.eventsService.processWebSocketMessage(
        messageData,
        this.activeRoomId,
        this.activeRoomName,
        this.events,
      );
      if (updateView === true) {
        setTimeout(() => {
          const item = document.querySelector('mat-list-item:last-child');
          if (item) {
            item.scrollIntoView();
          }
        }, 500);
      }
    });

    this.subscription.add(
      this.store
        .select(selectActiveRoomName)
        .subscribe(name => (this.activeRoomName = name)),
    );

    this.subscription.add(
      this.store
        .select(selectActiveRoom)
        .subscribe(roomId => (this.activeRoomId = roomId)),
    );

    this.subscription.add(
      this.store
        .select(selectTuneSyncEvent)
        .pipe(filter(data => data !== undefined))
        .subscribe((response: TuneSyncEvent) => {
          this.eventsService.processTuneSyncEvent(response);
        }),
    );

    this.subscription.add(
      this.store.select(selectUserId).subscribe((userId: number) => {
        this.userId = userId;
      }),
    );

    // get a list of events
    this.subscription.add(
      this.store
        .select(selectEvents)
        .pipe(
          filter(events => events !== undefined && events !== null),
          distinctUntilChanged(
            (prev, curr) =>
              prev[0] && curr[0] && prev[0].room_id === curr[0].room_id,
          ),
        )
        .subscribe((events: AppEvent[]) => {
          // new room, replace old events with new events
          this.showLoadMore = false;
          this.events = this.eventsService.processEvents(
            events,
            this.activeRoomName,
          );
          setTimeout(() => {
            const el = document.querySelector('mat-list-item:last-child');
            if (el) {
              el.scrollIntoView();
              this.showLoadMore = true;
            }
          }, 500);
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onInviteResponse(response: 'A' | 'R', roomId: number): void {
    this.store.dispatch(
      DashboardActions.createInviteResponseEvent({ roomId, response }),
    );
  }

  onLoadMore(): void {
    // call the backend with the next set of events
    this.store.dispatch(
      DashboardActions.getEventsByRoom({
        roomId: this.activeRoomId,
        creationTime: new Date(this.events[0].creation_time),
      }),
    );
  }
}
