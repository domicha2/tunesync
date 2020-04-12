import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatDialogState,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { isUndefined } from 'lodash';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { AppState } from '../../app.module';
import { FileList2, Role, Song, TuneSyncEvent } from '../dashboard.models';
import { QueueComponent } from '../queue/queue.component';
import * as DashboardActions from '../store/dashboard.actions';
import {
  selectActiveRoom,
  selectQueuedSongs,
  selectSongStatus,
  selectUserRole,
} from '../store/dashboard.selectors';
import { WebSocketService } from '../web-socket.service';
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

  queueDialogRef: MatDialogRef<QueueComponent>;

  constructor(
    private webSocketService: WebSocketService,
    private matSnackBar: MatSnackBar,
    private controlsService: ControlsService,
    private cdr: ChangeDetectorRef,
    private store: Store<AppState>,
    private matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store
        .select(selectActiveRoom)
        .pipe(filter(isUndefined))
        .subscribe(() => {
          // whenever the active room is cleared (user got kicked)
          if (
            this.queueDialogRef &&
            this.queueDialogRef.getState() === MatDialogState.OPEN
          ) {
            this.queueDialogRef.close();
          }
        }),
    );

    this.subscription.add(
      this.webSocketService.tuneSyncSubject.subscribe(
        (tuneSyncEvent: TuneSyncEvent) => {
          this.processWSTuneSyncEvent(tuneSyncEvent);
        },
      ),
    );

    this.subscription.add(
      this.controlsService.songsUploaded.subscribe((songsUploaded: number) => {
        let message: string;
        if (songsUploaded === 0) {
          message = 'Error uploading song(s)!';
        } else if (songsUploaded === 1) {
          message = 'Song uploaded successfully!';
        } else {
          message = `${songsUploaded} songs uploaded successfully!`;
        }
        this.matSnackBar.open(message, undefined, {
          duration: 2500,
        });
      }),
    );

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
   * Handle a TuneSync event from the WebSocket
   */
  private processWSTuneSyncEvent(tuneSyncEvent: TuneSyncEvent): void {
    // determine what type of event it was
    // if it is playing the dispatch set song stat
    // if it is modifying the queue, need to dispatch a new queue
    if (
      tuneSyncEvent.last_play === null ||
      tuneSyncEvent.last_modify_queue.event_id >
        tuneSyncEvent.last_play.event_id
    ) {
      // the  DJ made a modify queue event
      // need to dispatch new queue into my store
      this.store.dispatch(
        DashboardActions.storeQueue({
          queue: tuneSyncEvent.last_modify_queue.queue.map(
            ([id, length, name]) => ({ id, length, name }),
          ),
        }),
      );
    } else {
      // the DJ made a play event
      // ! could have race condition but handleTuneSync function has the same design
      this.store.dispatch(
        DashboardActions.setSongStatus({
          isPlaying: tuneSyncEvent.last_play.is_playing,
          seekTime: tuneSyncEvent.last_play.timestamp,
          queueIndex: tuneSyncEvent.last_play.queue_index,
        }),
      );
    }
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
        const prevSongIndex = this.queueIndex;
        this.queueIndex = songStatus.queueIndex;
        if (queue.length > 0) {
          if (songStatus.seekTime !== undefined) {
            this.seekTime = songStatus.seekTime;
          }

          if (
            queue[prevSongIndex] &&
            queue[prevSongIndex].id === queue[this.queueIndex].id
          ) {
            // same song so just rewind the current time to 0
            const song = this.getAudioElement();
            song.currentTime = 0;
            if (song.paused) {
              // the song will be paused automatically when the previous song finished
              // need to manually play it
              // normally we don't have to manually play the song since we have the autoplay flag
              // which will play the song for us
              // however in this special case we are playing the same song so it will not trigger autoplay
              song.play();
            }
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
        const prevSongIndex = this.queueIndex;
        this.queueIndex = songStatus.queueIndex;
        // need to set the current song, pause, then seek to the given time
        if (songStatus.seekTime !== undefined) {
          this.seekTime = songStatus.seekTime;
        }

        if (
          queue[prevSongIndex] &&
          queue[prevSongIndex].id === queue[this.queueIndex].id
        ) {
          // same song so just rewind the current time to 0
          const song = this.getAudioElement();
          song.currentTime = 0;
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

  onQueueClick(): void {
    this.queueDialogRef = this.matDialog.open(QueueComponent, {
      height: 'fit-content',
      width: '75%',
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

  onUploadChange(event: Event): void {
    // tslint:disable-next-line: no-string-literal
    const files: FileList = event.target['files'];
    const tunes: FileList2 = {
      length: files.length,
    };

    let totalUploadSizeBytes = 0;
    for (let i = 0; i < tunes.length; i++) {
      tunes[i] = files.item(i);
      totalUploadSizeBytes += tunes[i].size;
    }

    const NUMBER_OF_BYTES_IN_A_MB = 1048576;
    const totalUploadSizeMB = totalUploadSizeBytes / NUMBER_OF_BYTES_IN_A_MB;
    if (totalUploadSizeMB > 50) {
      this.matSnackBar.open(
        `File upload size of ${totalUploadSizeMB.toFixed(
          0,
        )}MB exceeded 50MB limit!`,
        undefined,
        {
          duration: 5000,
        },
      );
      return;
    }

    this.store.dispatch(DashboardActions.createTunes({ tunes }));
  }
}
