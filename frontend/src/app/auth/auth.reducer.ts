import { createReducer, on, Action } from '@ngrx/store';

import * as AuthActions from './auth.actions';

export interface AuthState {
  username: string;
}

export const initialState: AuthState = undefined;

const reducer = createReducer(
  initialState,
  on(AuthActions.storeUser, (state, user: any) => ({
    username: user.payload.username,
  })),
);

export function authReducer(state: AuthState | undefined, action: Action) {
  return reducer(state, action);
}
