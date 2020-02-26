import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { DashboardComponent } from './dashboard.component';
import { RoomsComponent } from './rooms/rooms.component';
import { UsersComponent } from './users/users.component';

import { QueueModule } from './queue/queue.module';

@NgModule({
  declarations: [DashboardComponent, RoomsComponent, UsersComponent],
  imports: [CommonModule, MatButtonModule, QueueModule, MatIconModule],
})
export class DashboardModule {}
