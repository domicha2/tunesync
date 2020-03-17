import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  AfterContentChecked,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Store } from '@ngrx/store';
import { Subscription, combineLatest } from 'rxjs';

import * as DashboardActions from '../store/dashboard.actions';
import {
  selectQueuedSongs,
  selectSongStatus,
  selectQueueIndex,
} from '../store/dashboard.selectors';
import { AppState } from '../../app.module';
import { Song } from '../dashboard.models';
import { QueueComponent } from '../queue/queue.component';
import { tap, filter, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss'],
})
export class ControlsComponent
  implements OnInit, OnDestroy, AfterContentChecked {
  subscription = new Subscription();

  @ViewChild('songElement') songElement: ElementRef;

  currentSong: Song;
  queue: Song[];

  songProgress: number;
  isPaused = true;

  seekTime = 0;
  pauseOnLoaded: boolean;
  queueIndex = 0;

  constructor(
    private cdr: ChangeDetectorRef,
    private store: Store<AppState>,
    private matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store
        .select(selectQueueIndex)
        .pipe(filter(index => index !== undefined))
        .subscribe(index => {
          console.log('queue index: ', index);
          this.queueIndex = index;
        }),
    );

    /**
     * if song status changes, make sure there exists a queue
     * if song status changes again thats fine
     * if queue changes, dont update (can check if song status is distinct)
     */
    this.subscription.add(
      combineLatest(
        this.store
          .select(selectSongStatus)
          .pipe(filter(status => typeof status.isPlaying === 'boolean')),
        this.store.select(selectQueuedSongs).pipe(
          filter(songs => songs !== null && songs !== undefined),
          tap((queue: Song[]) => {
            this.queue = queue;
            console.count('queued songs sub');
            console.log(queue);
          }),
        ),
      )
        .pipe(
          distinctUntilChanged(
            ([prevStatus, prevQueue], [currStatus, currQueue]) =>
              prevStatus.isPlaying === currStatus.isPlaying &&
              prevStatus.seekTime === currStatus.seekTime,
          ),
        )
        .subscribe(([songStatus, queuedSongs]) => {
          console.log('in the big subscribe callback');
          this.initSong(songStatus, queuedSongs);
        }),
    );
  }

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Called whenever the song status changes (pause or play or seeked)
   * @param songStatus
   * @param queue
   */
  initSong(
    songStatus: { isPlaying: boolean; seekTime: number },
    queue: Song[],
  ): void {
    console.log(this.queue);
    console.log('seek time:', songStatus.seekTime);
    if (songStatus.isPlaying === true) {
      this.pauseOnLoaded = false;
      if (this.currentSong) {
        // i believe this is executed when the websocket broadcast play on a paused song
        const song = this.getAudioElement();
        if (songStatus.seekTime !== undefined) {
          song.currentTime = songStatus.seekTime;
          console.log('after seeked time', song.currentTime);
        }
        song.play();
      } else {
        if (queue.length > 0) {
          if (songStatus.seekTime !== undefined) {
            this.seekTime = songStatus.seekTime;
          }

          // after this gets executed the onloadeddata event should trigger which would seek the song
          this.currentSong = queue[this.queueIndex];
        }
      }
    } else if (songStatus.isPlaying === false) {
      this.pauseOnLoaded = true;
      console.log('wanting to pause the song');
      if (this.currentSong === undefined) {
        // need to set the current song, pause, then seek to the given time
        if (songStatus.seekTime !== undefined) {
          this.seekTime = songStatus.seekTime;
        }
        this.currentSong = this.queue[this.queueIndex];
      } else {
        const song = this.getAudioElement();
        song.pause();
        song.currentTime = songStatus.seekTime;
      }
    }
  }

  getAudioElement(): HTMLAudioElement | undefined {
    if (this.songElement) {
      return this.songElement.nativeElement;
    } else {
      return undefined;
    }
  }

  // take advantage of timeupdate event
  setSongProgress(event: Event): void {
    const song = event.target;
    this.songProgress = (song['currentTime'] / song['duration']) * 100;
  }

  onPlay(): void {
    // check if there is an existing song
    if (this.currentSong) {
      // resume the song
      // dispatch an action telling user
      const song = this.getAudioElement();
      song.play();
      this.store.dispatch(
        DashboardActions.createPlaySongEvent({ timestamp: song.currentTime }),
      );
    } else {
      this.onNext(true);
    }
  }

  /**
   * Gets called when song automatically finishes
   * or when user presses next or when user presses play with no current song
   */
  onNext(triggerEvent: boolean): void {
    if (this.queueIndex + 1 < this.queue.length) {
      // there exists a song on the queue ready to be played
      this.store.dispatch(
        DashboardActions.setQueueIndex({ queueIndex: ++this.queueIndex }),
      );
      this.currentSong = this.queue[this.queueIndex];
      if (triggerEvent) {
        // user generated event
        this.store.dispatch(
          DashboardActions.createPlaySongEvent({ timestamp: 0 }),
        );
      }
    } else {
      // clear the current song
      this.currentSong = undefined;
    }
  }

  onReplay(): void {
    const song = this.getAudioElement();
    let timestamp: number;
    if (song.currentTime >= 10) {
      timestamp = song.currentTime - 10;
    } else {
      timestamp = 0;
    }
    this.store.dispatch(
      DashboardActions.createReplaySongEvent({
        timestamp,
        isPlaying: !this.isPaused,
      }),
    );
  }

  onForward(): void {
    const song = this.getAudioElement();
    let timestamp: number;
    if (song.duration - song.currentTime >= 10) {
      timestamp = song.currentTime + 10;
    } else {
      timestamp = song.duration;
    }
    this.store.dispatch(
      DashboardActions.createForwardSongEvent({
        timestamp,
        isPlaying: !this.isPaused,
      }),
    );
  }

  onPause(): void {
    const song = this.getAudioElement();
    song.pause();
    this.store.dispatch(
      DashboardActions.createPauseSongEvent({ timestamp: song.currentTime }),
    );
  }

  /**
   * Listen to the previous song in the queue
   */
  onPrevious(): void {
    this.store.dispatch(
      DashboardActions.createPreviousSongEvent({
        timestamp: 0,
        isPlaying: !this.isPaused,
        queueIndex: this.queueIndex - 1,
      }),
    );
  }

  /**
   * Auto-click the next song button for the user
   */
  onEnded(event: Event): void {
    console.log(event);
    this.onNext(false);
  }

  onUploadChange(event: Event): void {
    // tslint:disable-next-line: no-string-literal
    const tunes: FileList = event.target['files'];
    this.store.dispatch(DashboardActions.createTunes({ tunes }));
  }

  onQueueClick(): void {
    this.matDialog.open(QueueComponent, {});
  }

  /**
   * This function duplicates the code to alleviate a race condition bug
   * @param event
   */
  onLoadedData(event: Event): void {
    console.log('song is loaded', event);
    this.getAudioElement().currentTime = this.seekTime;
    console.log('on load start time 1', this.getAudioElement().currentTime);

    if (this.pauseOnLoaded) {
      // this is used for other people listening to the room
      this.getAudioElement().pause();
    }

    setTimeout(() => {
      if (!this.pauseOnLoaded) {
        this.getAudioElement().currentTime = this.seekTime + 1;
      } else {
        this.getAudioElement().currentTime = this.seekTime;
      }
      console.log('on load start time 2', this.getAudioElement().currentTime);
      this.seekTime = 0;
    }, 1000);
  }
}
