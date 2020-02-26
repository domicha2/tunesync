import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { DashboardComponent } from './dashboard.component';
import { RoomsComponent } from './rooms/rooms.component';
import { UsersComponent } from './users/users.component';

import { QueueModule } from './queue/queue.module';

@NgModule({
  declarations: [DashboardComponent, RoomsComponent, UsersComponent],
  imports: [QueueModule, MatIconModule],
})
export class DashboardModule {}
