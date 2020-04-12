import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { init } from '@sentry/browser';
import * as LogRocket from 'logrocket';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}

  onCreditsPage(): boolean {
    return this.router.url === '/credits';
  }
}
