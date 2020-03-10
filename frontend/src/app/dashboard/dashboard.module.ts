import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

import { DashboardComponent } from './dashboard.component';
import { RoomsComponent } from './rooms/rooms.component';
import { UsersComponent } from './users/users.component';
import { MessagingComponent } from './messaging/messaging.component';
import { ControlsComponent } from './controls/controls.component';
import { MainScreenComponent } from './main-screen/main-screen.component';
import { QueueComponent } from './queue/queue.component';
import { KickUserComponent } from './users/kick-user/kick-user.component';

@NgModule({
  declarations: [
    DashboardComponent,
    RoomsComponent,
    UsersComponent,
    ControlsComponent,
    MessagingComponent,
    MainScreenComponent,
    QueueComponent,
    KickUserComponent,
  ],
  imports: [
    FormsModule,
    CommonModule,
    DragDropModule,
    MatDialogModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class DashboardModule {}
