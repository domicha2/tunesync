import { NgModule } from '@angular/core';

import { DashboardComponent } from './dashboard.component';
import { RoomsComponent } from './rooms/rooms.component';
import { UsersComponent } from './users/users.component';

import { QueueModule } from './queue/queue.module';

@NgModule({
  declarations: [DashboardComponent, RoomsComponent, UsersComponent],
  imports: [QueueModule],
})
export class DashboardModule {}
