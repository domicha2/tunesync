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
import { selectQueuedSongs } from '../store/dashboard.selectors';
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
      this.store
        .pipe(select(selectQueuedSongs))
        .subscribe((queuedSongs: Song[]) => {
          console.count('sub');
          this.queue = queuedSongs;
          // TODO: if we have a list of songs ready in the queue
          // TODO: and no song already playing then autoplay the next song on queue
          if (
            this.queue &&
            this.queue[0] &&
            (this.currentSong === undefined ||
              (this.getAudioElement() && this.getAudioElement().ended))
          ) {
            console.log('updating the current song');
            this.currentSong = this.queue[0];
            setTimeout(() => {
              this.getAudioElement().play();
            }, 200);
          }
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
      return (song.currentTime / song.duration) * 100;
    } else {
      return 0;
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

  onPlay(): void {
    const song = this.getAudioElement();
    if (song) {
      song.play();
    }
  }

  onPause(): void {
    const song = this.getAudioElement();
    if (song) {
      song.pause();
    }
  }

  onPrevious(): void {}

  onNext(): void {
    // check if there even exists a song waiting on the queue
    if (this.queue && this.queue.length > 0) {
      // this.store.dispatch(
      //   DashboardActions.addAvailableSong({ song: this.currentSong }),
      // );
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
