import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { AppState } from '../../app.module';
import { FileList2, Role, Song } from '../dashboard.models';
import { QueueComponent } from '../queue/queue.component';
import * as DashboardActions from '../store/dashboard.actions';
import {
  selectQueuedSongs,
  selectSongStatus,
  selectUserRole,
} from '../store/dashboard.selectors';
import { ControlsService } from './controls.service';

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
  queueIndex = -1;

  userRole$: Observable<Role>;

  constructor(
    private matSnackBar: MatSnackBar,
    private controlsService: ControlsService,
    private cdr: ChangeDetectorRef,
    private store: Store<AppState>,
    private matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.controlsService.songsUploaded.subscribe((songsUploaded: number) => {
      this.matSnackBar.open(
        `${songsUploaded} songs uploaded successfully!`,
        undefined,
        {
          duration: 2500,
        },
      );
    });

    this.userRole$ = this.store.select(selectUserRole);

    /**
     * if song status changes, make sure there exists a queue
     * if song status changes again thats fine
     * if queue changes, dont update (can check if song status is distinct)
     */
    this.subscription.add(
      combineLatest([
        this.store
          .select(selectSongStatus)
          .pipe(
            filter(
              status =>
                typeof status.isPlaying === 'boolean' &&
                typeof status.queueIndex === 'number',
            ),
          ),
        this.store.select(selectQueuedSongs).pipe(
          filter(songs => songs !== null && songs !== undefined),
          tap((queue: Song[]) => {
            this.queue = queue;
            console.count('queued songs sub');
          }),
        ),
      ])
        .pipe(
          distinctUntilChanged(
            ([prevStatus, prevQueue], [currStatus, currQueue]) =>
              prevStatus.isPlaying === currStatus.isPlaying &&
              prevStatus.seekTime === currStatus.seekTime &&
              prevStatus.queueIndex === currStatus.queueIndex,
          ),
        )
        .subscribe(([songStatus, queuedSongs]) => {
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
   */
  initSong(
    songStatus: { isPlaying: boolean; seekTime: number; queueIndex: number },
    queue: Song[],
  ): void {
    if (songStatus.isPlaying === true) {
      this.pauseOnLoaded = false;
      if (this.currentSong && this.queueIndex === songStatus.queueIndex) {
        // i believe this is executed when the websocket broadcast play on a paused song
        const song = this.getAudioElement();
        if (songStatus.seekTime !== undefined) {
          song.currentTime = songStatus.seekTime;
        }
        song.play();
      } else {
        this.queueIndex = songStatus.queueIndex;
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
      if (
        this.currentSong === undefined ||
        this.queueIndex !== songStatus.queueIndex
      ) {
        this.queueIndex = songStatus.queueIndex;
        // need to set the current song, pause, then seek to the given time
        if (songStatus.seekTime !== undefined) {
          this.seekTime = songStatus.seekTime;
        }
        // this line can also clear out a song because queue index can be -1
        this.currentSong = this.queue[this.queueIndex];
        // have to manually set the pause flag since clearing the song doesn't modify it
        this.isPaused = true;
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
      if (triggerEvent) {
        // user generated event
        this.store.dispatch(
          DashboardActions.createNextSongEvent({
            timestamp: 0,
            isPlaying: !this.isPaused,
            queueIndex: this.queueIndex + 1,
          }),
        );
      } else {
        // on ended function turns it to true, need to turn it back off
        this.isPaused = false;
        this.store.dispatch(
          DashboardActions.setSongStatus({
            isPlaying: !this.isPaused,
            queueIndex: this.queueIndex + 1,
            seekTime: 0,
          }),
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
    this.onNext(false);
  }

  onUploadChange(event: Event): void {
    // tslint:disable-next-line: no-string-literal
    const files: FileList = event.target['files'];
    const tunes: FileList2 = {
      length: files.length,
    };
    for (let i = 0; i < tunes.length; i++) {
      tunes[i] = files.item(i);
    }
    this.store.dispatch(DashboardActions.createTunes({ tunes }));
  }

  onQueueClick(): void {
    this.matDialog.open(QueueComponent, {
      height: '85%',
      width: '65%',
    });
  }

  /**
   * This function duplicates the code to alleviate a race condition bug
   */
  onLoadedData(event: Event): void {
    this.getAudioElement().currentTime = this.seekTime;

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
      this.seekTime = 0;
    }, 1000);
  }
}
