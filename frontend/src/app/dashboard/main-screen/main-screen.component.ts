import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { environment } from '../../../environments/environment';
import { AppState } from '../../app.module';
import {
  selectEvents,
  selectActiveRoom,
  selectTuneSyncEvent,
} from '../store/dashboard.selectors';
import {
  AppEvent,
  EventType,
  ModifyQueueEvent,
  PlayEvent,
  TuneSyncEvent,
  QueueState,
  PlayState,
  TuneSyncEventWS,
} from '../dashboard.models';
import { selectUserId } from '../../auth/auth.selectors';
import * as DashboardActions from '../store/dashboard.actions';
import { distinctUntilChanged, filter } from 'rxjs/operators';

import * as moment from 'moment';

@Component({
  selector: 'app-main-screen',
  templateUrl: './main-screen.component.html',
  styleUrls: ['./main-screen.component.scss'],
})
export class MainScreenComponent implements OnInit, OnDestroy {
  subscription = new Subscription();
  events: AppEvent[] = [];
  webSocket: WebSocket;
  userId: number;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
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

    this.subscription.add(
      this.store.select(selectActiveRoom).subscribe((roomId: number) => {
        this.createWebSocket(roomId);
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
          this.handleEventsResponse(events);
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * refactor later
   */
  handleEventsResponse(events: AppEvent[]): void {
    this.events = events.sort((eventA, eventB) =>
      new Date(eventA.creation_time) > new Date(eventB.creation_time) ? 1 : -1,
    );
    setTimeout(() => {
      const el = document.querySelector('mat-list-item:last-child');
      if (el) {
        el.scrollIntoView();
      }
    }, 500);
  }

  createWebSocket(roomId: number): void {
    // check if room id has been set
    if (roomId !== undefined) {
      // check if there is already a connection
      if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
        // clear connection
        this.webSocket.close();
      }

      this.webSocket = new WebSocket(
        `${environment.webSocketUrl}?room_id=${roomId}`,
      );

      this.webSocket.onopen = (event: Event) => {
        console.log('connected to web socket');
      };

      this.webSocket.onmessage = (messageEvent: MessageEvent) => {
        const event: AppEvent = JSON.parse(messageEvent.data);
        console.log('payload from websocket: ', event);
        if (event.event_id || event['last_modify_queue']) {
          switch (event.event_type) {
            // !TUNESYNC EVENT
            case undefined:
              console.log('dealing with tunesync event');
              // determine what type of event it was
              // if it is playing the dispatch set song stat
              // if it is modifying the queue, need to dispatch a new queue
              const tuneSyncEvent = {
                last_modify_queue: event['last_modify_queue'],
                last_play: event['last_play'],
                play_time: event['play_time'],
              } as TuneSyncEventWS;
              if (
                tuneSyncEvent.last_play === null ||
                tuneSyncEvent.last_modify_queue.event_id >
                  tuneSyncEvent.last_play.event_id
              ) {
                // the  DJ made a modify queue event
                // need to dispatch new queue into my store
                this.store.dispatch(
                  DashboardActions.storeQueue({
                    queue: tuneSyncEvent.last_modify_queue.modify_queue.map(
                      ([id, length, name]) => ({ id, length, name }),
                    ),
                  }),
                );
              } else {
                // the DJ made a play event
                console.log('dj made a play event');
                // ! could have race condition but handleTuneSync function has the same design
                this.store.dispatch(
                  DashboardActions.setQueueIndex({
                    queueIndex: tuneSyncEvent.last_play.play.queue_index,
                  }),
                );
                this.store.dispatch(
                  DashboardActions.setSongStatus({
                    isPlaying: tuneSyncEvent.last_play.play.is_playing,
                    seekTime: tuneSyncEvent.last_play.play.timestamp,
                  }),
                );
              }
              break;
            case EventType.Messaging:
              break;
            default:
              console.error('bad event type');
              break;
          }
          this.events.push(event);
          setTimeout(
            () =>
              document
                .querySelector('mat-list-item:last-child')
                .scrollIntoView(),
            500,
          );
        }
      };

      this.webSocket.onerror = (event: Event) => {
        console.log('there was an error with the websocket');
      };

      this.webSocket.onclose = (closedEvent: CloseEvent) => {
        console.log('disconnected from web socket');
      };
    }
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
      queue = (tuneSyncEvent.last_modify_queue as QueueState).modify_queue.map(
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
      this.store.dispatch(DashboardActions.setQueueIndex({ queueIndex: -1 }));
    } else {
      playEvent = tuneSyncEvent.last_play as PlayState;
    }

    if (queue) {
      if (queue.length !== 0 && playEvent) {
        if (!playEvent.play.is_playing) {
          // EASY CASE
          this.store.dispatch(
            DashboardActions.setQueueIndex({
              queueIndex: playEvent.play.queue_index,
            }),
          );
          this.store.dispatch(
            DashboardActions.setSongStatus({
              seekTime: playEvent.play.timestamp,
              isPlaying: false,
            }),
          );
          return;
        }

        // queue exists and something played before
        const playTimeStamp = moment(tuneSyncEvent.play_time);
        let difference = moment().diff(playTimeStamp, 'seconds', true);
        console.log('time since last play action', difference);

        let songIndex: number;
        for (let i = playEvent.play.queue_index; i < queue.length; i++) {
          console.log(i);
          if (i === playEvent.play.queue_index) {
            // first iteration only
            console.log(
              'initial diff',
              queue[i].length - playEvent.play.timestamp < difference,
            );
            console.log(
              'init differe',
              queue[i].length - playEvent.play.timestamp,
            );
            if (queue[i].length - playEvent.play.timestamp < difference) {
              console.log('in the if statement some how');
              // remaining time in the first song can be subtracted
              difference -= queue[i].length - playEvent.play.timestamp;
            } else {
              console.log(
                'exiting after initial loop dispatch new queue index and dispatch new song status',
              );
              // stop here
              this.store.dispatch(
                DashboardActions.setQueueIndex({
                  queueIndex: playEvent.play.queue_index,
                }),
              );

              const seekTime = playEvent.play.timestamp + difference;
              console.log('finished in the first loop; seek at: ', seekTime);
              this.store.dispatch(
                DashboardActions.setSongStatus({
                  isPlaying: playEvent.play.is_playing,
                  seekTime,
                }),
              );
              break;
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
              DashboardActions.setQueueIndex({
                queueIndex: songIndex,
              }),
            );
            this.store.dispatch(
              DashboardActions.setSongStatus({
                isPlaying: playEvent.play.is_playing,
                seekTime,
              }),
            );
            break;
          }
        }

        // use this difference at that song index
        console.log('time remaining', difference, 'index', songIndex);
      }
    }
  }
}
