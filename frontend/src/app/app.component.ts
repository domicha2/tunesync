import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { init } from '@sentry/browser';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    init({
      dsn: environment.sentryUrl,
    });
  }

  onCreditsPage(): boolean {
    return this.router.url === '/credits';
  }
}
