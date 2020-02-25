import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AuthModule } from './auth/auth.module';

import { CreditsModule } from './credits/credits.module';
import { QueueModule } from './queue/queue.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    QueueModule,
    CreditsModule,
    AuthModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
