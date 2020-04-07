import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { AppState } from '../../app.module';
import { selectUserId } from '../../auth/auth.selectors';
import { AppEvent, EventType, TuneSyncEvent } from '../dashboard.models';
import * as DashboardActions from '../store/dashboard.actions';
import {
  selectActiveRoom,
  selectActiveRoomName,
  selectEvents,
  selectLoadMore,
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

  loadMore$: Observable<boolean>;

  constructor(
    private eventsService: EventsService,
    private webSocketService: WebSocketService,
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.loadMore$ = this.store.select(selectLoadMore);

    this.webSocketService.messageSubject.subscribe((messageData) => {
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
        .subscribe((name) => (this.activeRoomName = name)),
    );

    this.subscription.add(
      this.store
        .select(selectActiveRoom)
        .subscribe((roomId) => (this.activeRoomId = roomId)),
    );

    this.subscription.add(
      this.store
        .select(selectTuneSyncEvent)
        .pipe(filter((data) => data !== undefined))
        .subscribe((response: TuneSyncEvent) => {
          this.eventsService.processTuneSyncEvent(response);
        }),
    );

    this.subscription.add(
      this.store.select(selectUserId).subscribe((userId: number) => {
        this.userId = userId;
      }),
    );

    // pagination list of events
    this.subscription.add(
      this.store
        .select(selectEvents)
        .pipe(
          filter((events) => events !== undefined && events !== null),
          // ? this observable stream is emitting mysteriously more than it should
          distinctUntilChanged((prev, curr) => {
            return prev[0] && curr[0] && prev[0].event_id === curr[0].event_id;
          }),
        )
        .subscribe((events: AppEvent[]) => {
          this.handleEventsResponse(events);
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onInviteResponse(
    response: 'A' | 'R',
    roomId: number,
    eventIndex: number,
  ): void {
    this.store.dispatch(
      DashboardActions.createInviteResponseEvent({ roomId, response }),
    );

    const inviteEvent: AppEvent = this.events[eventIndex];

    const content = `You have ${
      response === 'A' ? 'accepted' : 'rejected'
    } the invite to ${inviteEvent.args.room_name} from ${inviteEvent.username}`;
    // cast the invite event to a msg event displaying what happened
    const joinEvent: AppEvent = {
      ...inviteEvent,
      user_id: this.userId,
      username: '',
      event_type: EventType.Messaging,
      args: {
        content,
      },
    };
    // remove the invite event (should not be able to respond again)
    this.events.splice(eventIndex, 1);
    // add a join message
    this.events.push(joinEvent);
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

  handleEventsResponse(events: AppEvent[]): void {
    const firstSetOfEvents = this.events.length === 0;
    let viewTop: boolean;

    if (firstSetOfEvents) {
      // no events set, so just set it in
      this.events = this.eventsService.processEvents(
        events,
        this.activeRoomName,
      );
      viewTop = false;
    } else {
      // already have a set of events
      // we are either adding on or swapping
      if (
        events[0] &&
        this.events[0] &&
        events[0].room_id === this.events[0].room_id
      ) {
        // combine existing events with the new set
        // first have to process the raw events
        this.events = this.eventsService
          .processEvents(events, this.activeRoomName)
          .concat(this.events);
        viewTop = true;
      } else {
        if (events.length === 0) {
          // the room has no events but there was existing events
          this.events = [];
        } else {
          // rooms are different so swap out the events
          this.events = this.eventsService.processEvents(
            events,
            this.activeRoomName,
          );
          viewTop = false;
        }
      }
    }

    // check if the new events have the same room id as the current events
    setTimeout(() => {
      let el: HTMLElement;
      if (viewTop) {
        // scroll to view the last child
        el = document.querySelector('mat-list-item:first-child');
      } else {
        // stay on the current child
        el = document.querySelector('mat-list-item:last-child');
      }
      if (el) {
        el.scrollIntoView();
      }
    }, 500);
  }
}
