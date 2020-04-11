import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from '../app.module';
import * as DashboardActions from '../dashboard/store/dashboard.actions';
import { WebSocketService } from '../dashboard/web-socket.service';
import * as AuthActions from './auth.actions';
import { selectErrorMessage, selectToken } from './auth.selectors';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit, OnDestroy {
  authForm = new FormGroup(
    {
      username: new FormControl(),
      password: new FormControl(),
    },
    Validators.required,
  );

  subscription = new Subscription();

  errorMessage: string;

  constructor(
    private title: Title,
    private webSocketService: WebSocketService,
    private router: Router,
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.title.setTitle('TuneSync | Auth');

    this.subscription.add(
      this.store
        .select(selectErrorMessage)
        .subscribe(errorMessage => (this.errorMessage = errorMessage)),
    );

    this.subscription.add(
      this.store.pipe(select(selectToken)).subscribe(token => {
        if (token) {
          // this gets executed anytime the authentication variables change
          // for now lets check if the mock token exists anyways
          // will probably have to refactor this but this is for testing

          // make a request to get a list of rooms for the user to go into
          this.store.dispatch(DashboardActions.getRooms());
          this.webSocketService.createWebSocket(token);
          this.router.navigate(['/dashboard']);
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Attempts to create an account for the user
   */
  onSignUp(): void {
    this.store.dispatch(AuthActions.signUp(this.authForm.value));
  }

  /**
   * Attempts to authenticate the user
   */
  onSignIn(): void {
    if (this.authForm.invalid) return;

    this.store.dispatch(AuthActions.signIn(this.authForm.value));
  }
}
