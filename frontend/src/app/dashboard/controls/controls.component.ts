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

  onPlay(): void {
    this.song.play();
  }

  onPause(): void {
    this.song.pause();
  }
}
