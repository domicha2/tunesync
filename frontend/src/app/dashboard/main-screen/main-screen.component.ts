import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { AppState } from '../../app.module';
import { selectUserId } from '../../auth/auth.selectors';
import {
  AppEvent,
  PlayState,
  QueueState,
  TuneSyncEvent,
} from '../dashboard.models';
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
          this.handleTuneSyncEvent(response);
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

  handleTuneSyncEvent(tuneSyncEvent: TuneSyncEvent): void {
    let queue;
    let playEvent;
    // ! might have to relook at the null logic
    if (tuneSyncEvent.last_modify_queue === null) {
      this.store.dispatch(
        DashboardActions.storeQueue({
          queue: [],
        }),
      );
    } else {
      queue = (tuneSyncEvent.last_modify_queue as QueueState).queue.map(
        ([id, length, name]) => ({
          id,
          length,
          name,
        }),
      );
      this.store.dispatch(DashboardActions.storeQueue({ queue }));
    }
    if (tuneSyncEvent.last_play === null) {
      // no last play state
      this.store.dispatch(
        DashboardActions.setSongStatus({
          isPlaying: false,
          seekTime: 0,
          queueIndex: -1,
        }),
      );
    } else {
      playEvent = tuneSyncEvent.last_play as PlayState;
    }

    if (queue) {
      if (queue.length !== 0 && playEvent) {
        if (!playEvent.is_playing) {
          // EASY CASE
          this.store.dispatch(
            DashboardActions.setSongStatus({
              seekTime: playEvent.timestamp,
              isPlaying: false,
              queueIndex: playEvent.queue_index,
            }),
          );
          return;
        }

        // queue exists and something played before
        const playTimeStamp = moment(tuneSyncEvent.play_time);
        let difference = moment().diff(playTimeStamp, 'seconds', true);
        console.log('time since last play action', difference);

        let songIndex: number;
        for (let i = playEvent.queue_index; i < queue.length; i++) {
          if (i === playEvent.queue_index) {
            // first iteration only
            console.log('init differe', queue[i].length - playEvent.timestamp);
            if (queue[i].length - playEvent.timestamp < difference) {
              // remaining time in the first song can be subtracted
              difference -= queue[i].length - playEvent.timestamp;
            } else {
              console.log(
                'exiting after initial loop dispatch new queue index and dispatch new song status',
              );
              // stop here

              const seekTime = playEvent.timestamp + difference;
              console.log('finished in the first loop; seek at: ', seekTime);
              this.store.dispatch(
                DashboardActions.setSongStatus({
                  isPlaying: playEvent.is_playing,
                  seekTime,
                  queueIndex: playEvent.queue_index,
                }),
              );
              return;
            }
            // do need to execute logic below
            continue;
          }
          // find where the current song is in the queue and the timestamp to seek
          if (queue[i].length < difference) {
            difference -= queue[i].length;
          } else {
            songIndex = i;
            // use this time to seek to the current song
            const seekTime = difference;
            console.log('seek time: ', seekTime);

            this.store.dispatch(
              DashboardActions.setSongStatus({
                isPlaying: playEvent.is_playing,
                seekTime,
                queueIndex: songIndex,
              }),
            );
            // use this difference at that song index
            console.log('time remaining', difference, 'index', songIndex);
            return;
          }
        }

        if (songIndex === undefined) {
          this.store.dispatch(
            DashboardActions.setSongStatus({
              isPlaying: false,
              seekTime: queue[queue.length - 1].length,
              queueIndex: queue.length - 1,
            }),
          );
        }
      }
    }
  }

  onInviteResponse(response: 'A' | 'R', roomId: number): void {
    this.store.dispatch(
      DashboardActions.createInviteResponseEvent({ roomId, response }),
    );
  }

  onLoadMore(): void {
    // call the backend with the next set of events
  }
}
