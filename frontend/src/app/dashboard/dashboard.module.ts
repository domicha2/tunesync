import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { DashboardComponent } from './dashboard.component';
import { RoomsComponent } from './rooms/rooms.component';
import { UsersComponent } from './users/users.component';

import { QueueModule } from './queue/queue.module';
import { ControlsComponent } from './controls/controls.component';

@NgModule({
  declarations: [
    DashboardComponent,
    RoomsComponent,
    UsersComponent,
    ControlsComponent,
  ],
  imports: [
    CommonModule,
    DragDropModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    QueueModule,
  ],
})
export class DashboardModule {}
