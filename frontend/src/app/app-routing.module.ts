import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthComponent } from './auth/auth.component';
import { CreditsComponent } from './credits/credits.component';
import { QueueComponent } from './queue/queue.component';

const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'credits', component: CreditsComponent },
  { path: 'queue', component: QueueComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
