import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { QueueComponent } from './queue.component';

@NgModule({
  declarations: [QueueComponent],
  imports: [CommonModule, DragDropModule],
})
export class QueueModule {}
