import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthEffects } from './auth/auth.effects';
import { AuthModule } from './auth/auth.module';
import { authReducer, AuthState } from './auth/auth.reducer';
import { CreditsModule } from './credits/credits.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DashboardEffects } from './dashboard/store/dashboard.effects';
import {
  dashboardReducer,
  DashboardState,
} from './dashboard/store/dashboard.reducer';
import { HttpAuthInterceptor } from './http-auth-interceptor';

export interface AppState {
  auth: AuthState;
  dashboard: DashboardState;
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    DashboardModule,
    CreditsModule,
    AuthModule,
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    StoreModule.forRoot({ auth: authReducer, dashboard: dashboardReducer }),
    StoreDevtoolsModule.instrument({
      maxAge: 50,
    }),
    EffectsModule.forRoot([AuthEffects, DashboardEffects]),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: HttpAuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
