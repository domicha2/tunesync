import { Component } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.component.html',
  styleUrls: ['./queue.component.scss'],
})
export class QueueComponent {
  // DEMO: remove hardcoded songs
  queuedSongs = ['song A', 'Song B', 'Lose you to love me - Selena Gomez'];
  availableSongs = ['Song d', 'my favourite song', 'Senorita'];

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
  }
}
