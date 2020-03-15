import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';

import * as DashboardActions from '../store/dashboard.actions';
import {
  selectQueuedSongs,
  selectIsPlaying,
} from '../store/dashboard.selectors';
import { AppState } from '../../app.module';
import { Song } from '../dashboard.models';
import { QueueComponent } from '../queue/queue.component';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss'],
})
export class ControlsComponent implements OnInit, OnDestroy {
  subscription = new Subscription();

  @ViewChild('songElement') songElement: ElementRef;

  currentSong: Song;
  queue: Song[];

  constructor(private store: Store<AppState>, private matDialog: MatDialog) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store.select(selectIsPlaying).subscribe((isPlaying: boolean) => {
        if (isPlaying === true) {
          this.getAudioElement().play();
        } else if (isPlaying === false) {
          this.getAudioElement().pause();
        }
      }),
    );

    this.subscription.add(
      this.store
        .pipe(select(selectQueuedSongs))
        .subscribe((queuedSongs: Song[]) => {
          console.count('sub');
          this.queue = queuedSongs;
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getAudioElement(): HTMLAudioElement | undefined {
    if (this.songElement) {
      return this.songElement.nativeElement;
    } else {
      return undefined;
    }
  }

  getSongProgress(): number {
    const song = this.getAudioElement();
    if (song) {
      if (song.currentTime && song.duration) {
        return (song.currentTime / song.duration) * 100;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
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
      this.onNext();
    }
  }

  onReplay(): void {
    const song = this.getAudioElement();
    if (song) {
      if (song.currentTime >= 10) {
        song.currentTime -= 10;
      } else {
        song.currentTime = 0;
      }
    }
  }

  onForward(): void {
    const song = this.getAudioElement();
    if (song) {
      if (song.duration - song.currentTime >= 10) {
        song.currentTime += 10;
      } else {
        song.currentTime = song.duration;
      }
    }
  }

  onPause(): void {
    const song = this.getAudioElement();
    if (song) {
      song.pause();
      this.store.dispatch(
        DashboardActions.createPauseSongEvent({ something: {} }),
      );
    }
  }

  onPrevious(): void {}

  onNext(): void {
    // check if there even exists a song waiting on the queue
    if (this.queue && this.queue.length > 0) {
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

  onUploadChange(event: Event): void {
    // tslint:disable-next-line: no-string-literal
    const tune: File = event.target['files'][0];
    this.store.dispatch(DashboardActions.createTune({ tune }));
  }

  onQueueClick(): void {
    this.matDialog.open(QueueComponent, {});
  }
}
