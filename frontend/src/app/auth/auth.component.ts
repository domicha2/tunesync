import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';

import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';

import * as AuthActions from './auth.actions';
import * as DashboardActions from '../dashboard/store/dashboard.actions';

import { AppState } from '../app.module';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit, OnDestroy {
  authForm = new FormGroup({
    username: new FormControl(),
    password: new FormControl(),
  });

  subscription = new Subscription();

  constructor(private router: Router, private store: Store<AppState>) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store.pipe(select('auth')).subscribe(data => {
        console.log('data from auth: ', data);
        if (data) {
          // this gets executed anytime the authentication variables change
          // for now lets check if the mock token exists anyways
          // will probably have to refactor this but this is for testing
          if (data.token) {
            // make a request to get a list of rooms for the user to go into
            console.log('authenticated');
            this.store.dispatch(DashboardActions.getRooms());
            this.router.navigate(['/dashboard']);
          }
        }
      }),
    );

    document.querySelector('title').innerText = 'TuneSync - Auth';
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
    this.store.dispatch(AuthActions.signIn(this.authForm.value));
  }
}
