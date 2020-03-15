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

  constructor(
    private cdr: ChangeDetectorRef,
    private store: Store<AppState>,
    private matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
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
      if (this.currentSong) {
        // i believe this is executed when the websocket broadcast play on a paused song
        const song = this.getAudioElement();
        if (songStatus.seekTime !== undefined) {
          song.currentTime = songStatus.seekTime;
        }
        song.play();
      } else {
        if (queue.length > 0) {
          if (songStatus.seekTime !== undefined) {
            this.seekTime = songStatus.seekTime;
          }

          // after this gets executed the onloadeddata event should trigger which would seek the song
          this.currentSong = queue[0];
          this.queue.splice(0, 1);
          this.store.dispatch(
            DashboardActions.storeQueue({ queue: this.queue }),
          );
        }
      }
    } else if (songStatus.isPlaying === false) {
      // this is used for other people listening to the room
      this.getAudioElement().pause();
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
      console.log('if statement');
      // resume the song
      // dispatch an action telling user
      const song = this.getAudioElement();
      song.play();
      this.store.dispatch(
        DashboardActions.createPlaySongEvent({ something: {} }),
      );
    } else {
      console.log('else');
      // check if there is a song on the queue to pop
      this.onNext(true);
    }
  }

  onReplay(): void {
    const song = this.getAudioElement();
    if (song.currentTime >= 10) {
      this.store.dispatch(DashboardActions.createReplaySongEvent({}));
      song.currentTime -= 10;
    } else {
      song.currentTime = 0;
    }
  }

  onForward(): void {
    const song = this.getAudioElement();
    if (song.duration - song.currentTime >= 10) {
      this.store.dispatch(DashboardActions.createForwardSongEvent({}));
      song.currentTime += 10;
    } else {
      song.currentTime = song.duration;
    }
  }

  onPause(): void {
    const song = this.getAudioElement();
    song.pause();
    this.store.dispatch(
      DashboardActions.createPauseSongEvent({ something: {} }),
    );
  }

  onPrevious(): void {}

  /**
   * Gets called when song automatically finishes
   * or when user presses next or when user presses play with no current song
   */
  onNext(triggerEvent: boolean): void {
    // check if there even exists a song waiting on the queue
    if (this.queue && this.queue.length > 0) {
      this.currentSong = this.queue[0];
      this.queue.splice(0, 1);
      this.store.dispatch(DashboardActions.storeQueue({ queue: this.queue }));

      if (triggerEvent) {
        this.store.dispatch(
          DashboardActions.createPlaySongEvent({ something: {} }),
        );
      }
    } else {
      // clear the current song
      this.currentSong = undefined;
    }
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
    const tune: File = event.target['files'][0];
    this.store.dispatch(DashboardActions.createTune({ tune }));
  }

  onQueueClick(): void {
    this.matDialog.open(QueueComponent, {});
  }

  onLoadedData(event: Event): void {
    console.log('song is loaded', event);
    this.getAudioElement().currentTime = this.seekTime;
    this.seekTime = 0;
  }
}
