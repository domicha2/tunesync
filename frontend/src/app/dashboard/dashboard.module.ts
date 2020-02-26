import { NgModule } from '@angular/core';

import { DashboardComponent } from './dashboard.component';
import { RoomsComponent } from './rooms/rooms.component';
import { UsersComponent } from './users/users.component';

@NgModule({
  declarations: [DashboardComponent, RoomsComponent, UsersComponent],
})
export class DashboardModule {}
