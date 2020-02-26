import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { DashboardComponent } from './dashboard.component';
import { RoomsComponent } from './rooms/rooms.component';
import { UsersComponent } from './users/users.component';
import { MessagingComponent } from './messaging/messaging.component';
import { ControlsComponent } from './controls/controls.component';

import { QueueModule } from './queue/queue.module';

@NgModule({
  declarations: [
    DashboardComponent,
    RoomsComponent,
    UsersComponent,
    ControlsComponent,
    MessagingComponent,
  ],
  imports: [
    CommonModule,
    DragDropModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    QueueModule,
  ],
})
export class DashboardModule {}
