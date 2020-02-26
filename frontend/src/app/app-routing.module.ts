import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthComponent } from './auth/auth.component';
import { CreditsComponent } from './credits/credits.component';
import { QueueComponent } from './queue/queue.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'credits', component: CreditsComponent },
  { path: 'queue', component: QueueComponent },
  { path: '**', redirectTo: '/dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
