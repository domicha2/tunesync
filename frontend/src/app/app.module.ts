import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { EffectsModule } from '@ngrx/effects';
import {
  MetaReducer,
  StoreModule,
  USER_PROVIDED_META_REDUCERS,
} from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import * as LogRocket from 'logrocket';
import createNgrxMiddleware from 'logrocket-ngrx';
import { environment } from '../environments/environment';
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
import { SentryErrorHandler } from './sentry-error-handler';

export interface AppState {
  auth: AuthState;
  dashboard: DashboardState;
}

const logrocketMiddleware = createNgrxMiddleware(LogRocket);

export function getMetaReducers(): MetaReducer<any>[] {
  return [logrocketMiddleware];
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
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
    }),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: HttpAuthInterceptor, multi: true },
    { provide: ErrorHandler, useClass: SentryErrorHandler },
    { provide: USER_PROVIDED_META_REDUCERS, useFactory: getMetaReducers },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
