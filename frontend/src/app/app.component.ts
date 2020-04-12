import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { init } from '@sentry/browser';
import * as LogRocket from 'logrocket';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    init({
      dsn: 'https://6d0eb4af612f4c62918ee814218dee0a@sentry.io/5173931',
    });
    LogRocket.init('squad/tunesync');
  }

  onCreditsPage(): boolean {
    return this.router.url === '/credits';
  }
}
