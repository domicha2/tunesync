import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthComponent } from './auth/auth.component';
import { CreditsComponent } from './credits/credits.component';

const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'credits', component: CreditsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
