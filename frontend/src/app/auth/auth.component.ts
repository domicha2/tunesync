import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';

import * as AuthActions from './auth.actions';

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

  constructor(private store: Store<{ auth: any }>) {}

  ngOnInit(): void {
    this.subscription.add(
      this.store.pipe(select('auth')).subscribe(data => {
        console.log('data from auth: ');
        console.log(data);
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
