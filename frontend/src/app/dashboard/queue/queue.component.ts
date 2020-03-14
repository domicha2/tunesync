import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { AppState } from '../../app.module';

import {
  selectQueuedSongs,
  selectAvailableSongs,
} from '../store/dashboard.selectors';
import * as DashboardActions from '../store/dashboard.actions';
import { Song } from '../dashboard.models';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.component.html',
  styleUrls: ['./queue.component.scss'],
})
export class QueueComponent implements OnInit, OnDestroy {
  subscription = new Subscription();

  queuedSongs: Song[];
  availableSongs: Song[];

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.store.dispatch(DashboardActions.getAvailableSongs());

    this.subscription.add(
      this.store.select(selectQueuedSongs).subscribe((queuedSongs: Song[]) => {
        if (this.queuedSongs) {
          this.queuedSongs = queuedSongs;
        } else {
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

  drop(event: CdkDragDrop<string[]>): void {
    if (event.previousContainer === event.container) {
      // reorder list
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    // the queue has changed, need to store the updated queue
    this.store.dispatch(
      DashboardActions.storeSongs({
        queuedSongs: this.queuedSongs,
        availableSongs: this.availableSongs,
      }),
    );
  }
}
