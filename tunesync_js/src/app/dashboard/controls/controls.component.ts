import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss'],
})
export class ControlsComponent implements OnInit {
  song: HTMLAudioElement;

  ngOnInit(): void {
    this.song = document.querySelector('audio#main-song');
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

  onNext(): void {}
}
