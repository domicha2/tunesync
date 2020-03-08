import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import { AuthService } from './auth.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  signIn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.signIn),
      switchMap(credentials =>
        this.authService
          .signIn({
            username: credentials.username,
            password: credentials.password,
          })
          .pipe(
            map(user => ({ type: AuthActions.storeUser.type, payload: user })),
            catchError(() => EMPTY),
          ),
      ),
    ),
  );

  signUp$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.signUp),
      switchMap(credentials =>
        this.authService
          .signUp({
            username: credentials.username,
            password: credentials.password,
          })
          .pipe(
            map(user => ({ type: AuthActions.storeUser.type, payload: user })),
            catchError(() => EMPTY),
          ),
      ),
    ),
  );

  constructor(private actions$: Actions, private authService: AuthService) {}
}
