import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import * as AuthActions from './auth.actions';
import { AuthService } from './auth.service';

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
            map(user => ({
              type: AuthActions.storeUser.type,
              user: {
                userId: user.user_id,
                token: user.token,
                username: credentials.username,
              },
            })),
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
            // TODO: ideally should just dispatch an action to signify successful sign up
            map(user => ({ type: AuthActions.storeUser.type, payload: user })),
            catchError(() => EMPTY),
          ),
      ),
    ),
  );

  constructor(private actions$: Actions, private authService: AuthService) {}
}
