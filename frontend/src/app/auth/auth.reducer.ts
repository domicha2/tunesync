import { createReducer, on, Action } from '@ngrx/store';

import * as AuthActions from './auth.actions';

export interface AuthState {
  userId: number;
  token: string;
}

export const initialState: AuthState = undefined;

const reducer = createReducer(
  initialState,
  on(AuthActions.storeUser, (state, user: any) => ({
    userId: user.payload.id,
    token: user.payload.token,
  })),
);

export function authReducer(state: AuthState | undefined, action: Action) {
  return reducer(state, action);
}
