import { Component, OnInit, OnDestroy } from '@angular/core';

import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';

import * as DashboardActions from '../store/dashboard.actions';
import { selectQueuedSongs } from '../store/dashboard.selectors';
import { AppState } from '../../app.module';
import { Song } from '../dashboard.models';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss'],
})
export class ControlsComponent implements OnInit, OnDestroy {
  subscription = new Subscription();

  song: HTMLAudioElement;

  currentSong: Song = { name: 'sample-0.mp3' };
  queue: Song[];

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store
        .pipe(select(selectQueuedSongs))
        .subscribe((queuedSongs: Song[]) => {
          this.queue = queuedSongs;
        }),
    );
    this.store.dispatch(DashboardActions.getQueue());

    this.song = document.querySelector('audio#main-song');
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getSongProgress(): number {
    if (this.song) {
      return (this.song.currentTime / this.song.duration) * 100;
    } else {
      return 0;
    }
  }

  onReplay(): void {
    if (this.song) {
      if (this.song.currentTime >= 10) {
        this.song.currentTime -= 10;
      } else {
        this.song.currentTime = 0;
      }
    }
  }

  onForward(): void {
    if (this.song) {
      if (this.song.duration - this.song.currentTime >= 10) {
        this.song.currentTime += 10;
      } else {
        this.song.currentTime = this.song.duration;
      }
    }
  }

  onPlay(): void {
    if (this.song) {
      this.song.play();
    }
  }

  onPause(): void {
    if (this.song) {
      this.song.pause();
    }
  }

  onPrevious(): void {}

  onNext(): void {
    // check if there even exists a song waiting on the queue
    if (this.queue && this.queue.length > 0) {
      this.store.dispatch(
        DashboardActions.addAvailableSong({ song: this.currentSong }),
      );
      this.currentSong = this.queue[0];
      this.queue.splice(0, 1);
      this.store.dispatch(DashboardActions.storeQueue({ queue: this.queue }));
    }
  }

  /**
   * Auto-click the next song button for the user
   */
  onEnded(event: Event): void {
    console.log(event);
    this.onNext();
  }
}
