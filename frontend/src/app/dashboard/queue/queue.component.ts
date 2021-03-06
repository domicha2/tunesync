import {
  CdkDragDrop,
  copyArrayItem,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { isArray } from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AppState } from '../../app.module';
import { Role, Song } from '../dashboard.models';
import * as DashboardActions from '../store/dashboard.actions';
import {
  selectAvailableSongs,
  selectQueueIndexAndSongs,
  selectUserRole,
} from '../store/dashboard.selectors';
import { QueueService } from './queue.service';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.component.html',
  styleUrls: ['./queue.component.scss'],
})
export class QueueComponent implements OnInit, OnDestroy {
  subscription = new Subscription();

  masterQueue: Song[] = [];
  queuedSongs: Song[] = [];
  availableSongs: Song[] = [];
  songIndex: number;

  userRole$: Observable<Role>;

  prevPage: string | null;
  nextPage: string | null;

  constructor(
    private queueService: QueueService,
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.queueService.availSongsPrevNextSubject.subscribe(
        ({ prev, next }) => {
          this.prevPage = prev;
          this.nextPage = next;
        },
      ),
    );

    this.userRole$ = this.store.select(selectUserRole);

    this.subscription.add(
      this.store
        .select(selectQueueIndexAndSongs)
        .pipe(
          filter(data => data.index !== undefined && data.songs !== undefined),
        )
        .subscribe(data => {
          this.songIndex = data.index;
          // have two queues, one visible and one in the background
          if (data.songs) {
            this.masterQueue = data.songs.slice();
            this.queuedSongs = data.songs.slice(data.index + 1);
          } else {
            this.masterQueue = [];
            this.queuedSongs = [];
          }
        }),
    );

    this.subscription.add(
      this.store
        .select(selectAvailableSongs)
        .pipe(
          filter(isArray),
          map(songs => songs.slice()),
        )
        .subscribe((availableSongs: Song[]) => {
          this.availableSongs = availableSongs;
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  drop(event: CdkDragDrop<string[]>, container: 'queue' | 'available'): void {
    if (event.previousContainer === event.container) {
      // reorder list
      // only queue can be reordered
      if (container === 'queue') {
        // only update if element is actually going to a new index
        if (event.previousIndex !== event.currentIndex) {
          moveItemInArray(
            event.container.data,
            event.previousIndex,
            event.currentIndex,
          );

          // update everyone because queue got reordered
          this.store.dispatch(
            DashboardActions.createModifyQueueEvent({
              queue: this.masterQueue
                .slice(0, this.songIndex + 1)
                .concat(this.queuedSongs)
                .map(el => el.id),
            }),
          );
        }
      }
    } else {
      if (container === 'queue') {
        copyArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );
      } else if (container === 'available') {
        // remove the song from the queue
        // don't add it to the available songs
        event.previousContainer.data.splice(event.previousIndex, 1);
      }

      // queue lost or gained an item, need to update websocket
      this.store.dispatch(
        DashboardActions.createModifyQueueEvent({
          queue: this.masterQueue
            .slice(0, this.songIndex + 1)
            .concat(this.queuedSongs)
            .map(el => el.id),
        }),
      );
    }

    // the queue has changed, need to store the updated queue
    // this.store.dispatch(
    //   DashboardActions.storeSongs({
    //     queuedSongs: this.queuedSongs,
    //     availableSongs: this.availableSongs,
    //   }),
    // );
  }

  trackBySongId(index: number, item: Song): number {
    return item.id;
  }
}
