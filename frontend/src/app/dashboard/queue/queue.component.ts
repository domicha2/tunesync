import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { debounceTime, filter, map, startWith } from 'rxjs/operators';
import { AppState } from '../../app.module';
import { Filters, Role, Song } from '../dashboard.models';
import * as DashboardActions from '../store/dashboard.actions';
import {
  selectAvailableSongs,
  selectQueueIndexAndSongs,
  selectUserRole,
} from '../store/dashboard.selectors';

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

  nameControl = new FormControl();
  albumControl = new FormControl();
  artistControl = new FormControl();

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.subscription.add(
      combineLatest([
        this.nameControl.valueChanges.pipe(startWith('')),
        this.albumControl.valueChanges.pipe(startWith('')),
        this.artistControl.valueChanges.pipe(startWith('')),
      ])
        .pipe(
          debounceTime(250),
          map(([name, album, artist]) => ({
            name,
            album,
            artist,
          })),
        )
        .subscribe((filters: Filters) => {
          this.store.dispatch(DashboardActions.getAvailableSongs({ filters }));
        }),
    );

    this.userRole$ = this.store.select(selectUserRole);

    this.subscription.add(
      this.store
        .select(selectQueueIndexAndSongs)
        .pipe(
          filter(
            (data) => data.index !== undefined && data.songs !== undefined,
          ),
        )
        .subscribe((data) => {
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
                .map((el) => el.id),
            }),
          );
        }
      }
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      // queue lost or gained an item, need to update websocket
      this.store.dispatch(
        DashboardActions.createModifyQueueEvent({
          queue: this.masterQueue
            .slice(0, this.songIndex + 1)
            .concat(this.queuedSongs)
            .map((el) => el.id),
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
