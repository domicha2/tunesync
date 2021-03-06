import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ControlsComponent } from './controls/controls.component';
import { SongUrlPipe } from './controls/song-url.pipe';
import { DashboardComponent } from './dashboard.component';
import { MainScreenComponent } from './main-screen/main-screen.component';
import { MessagingComponent } from './messaging/messaging.component';
import { NotificationsService } from './notifications.service';
import { CreatePollComponent } from './poll/create-poll/create-poll.component';
import { PollResultsComponent } from './poll/poll-results/poll-results.component';
import { PollComponent } from './poll/poll/poll.component';
import { PollsViewerComponent } from './poll/polls-viewer/polls-viewer.component';
import { AvailableSongFilterComponent } from './queue/available-song-filter/available-song-filter.component';
import { QueueComponent } from './queue/queue.component';
import { AddRoomComponent } from './rooms/add-room/add-room.component';
import { RoomsComponent } from './rooms/rooms.component';
import { InviteComponent } from './users/invite/invite.component';
import { KickUserComponent } from './users/kick-user/kick-user.component';
import { UsersSearchSelectComponent } from './users/users-search-select/users-search-select.component';
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
    CreatePollComponent,
    PollComponent,
    PollResultsComponent,
    PollsViewerComponent,
    AvailableSongFilterComponent,
    UsersSearchSelectComponent,
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    DragDropModule,
    MatDialogModule,
    MatBadgeModule,
    MatExpansionModule,
    MatMenuModule,
    MatListModule,
    MatStepperModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  providers: [NotificationsService],
})
export class DashboardModule {}
