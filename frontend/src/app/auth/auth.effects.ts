import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import * as AuthActions from './auth.actions';
import { AuthService } from './auth.service';
import * as LogRocket from 'logrocket';

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
            tap(user => {
              LogRocket.identify(user.user_id, {
                name: credentials.username
              });
            }),
            map(user => ({
              type: AuthActions.storeUser.type,
              user: {
                userId: user.user_id,
                token: user.token,
                username: credentials.username,
              },
            })),
            catchError((error: HttpErrorResponse) =>
              of({
                type: AuthActions.setAuthError.type,
                details: error.error.details,
              }),
            ),
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
            // TODO: ideally should just dispatch an action to signify successful sign up
            map(user => ({
              type: AuthActions.storeUser.type,
              user: {
                userId: user.user_id,
                token: user.token,
                username: credentials.username,
              },
            })),
            catchError((error: HttpErrorResponse) =>
              of({
                type: AuthActions.setAuthError.type,
                details: error.error.details,
              }),
            ),
          ),
      ),
    ),
  );

  constructor(private actions$: Actions, private authService: AuthService) {}
}
