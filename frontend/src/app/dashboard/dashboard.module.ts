import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ControlsComponent } from './controls/controls.component';
import { SongUrlPipe } from './controls/song-url.pipe';
import { DashboardComponent } from './dashboard.component';
import { MainScreenComponent } from './main-screen/main-screen.component';
import { MessagingComponent } from './messaging/messaging.component';
import { NotificationsService } from './notifications.service';
import { QueueComponent } from './queue/queue.component';
import { AddRoomComponent } from './rooms/add-room/add-room.component';
import { RoomsComponent } from './rooms/rooms.component';
import { InviteComponent } from './users/invite/invite.component';
import { KickUserComponent } from './users/kick-user/kick-user.component';
import { UsersComponent } from './users/users.component';

@NgModule({
  declarations: [
    SongUrlPipe,
    InviteComponent,
    DashboardComponent,
    RoomsComponent,
    UsersComponent,
    ControlsComponent,
    MessagingComponent,
    MainScreenComponent,
    QueueComponent,
    KickUserComponent,
    AddRoomComponent,
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    DragDropModule,
    MatDialogModule,
    MatBadgeModule,
    MatExpansionModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  providers: [NotificationsService],
})
export class DashboardModule {}
