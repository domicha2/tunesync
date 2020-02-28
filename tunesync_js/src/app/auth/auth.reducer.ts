import { createReducer, on, Action } from '@ngrx/store';

import * as AuthActions from './auth.actions';

export interface State {
  username: string;
}

export const initialState: State = undefined;

const reducer = createReducer(
  initialState,
  on(AuthActions.storeUser, (state, user: any) => ({
    username: user.payload.username,
  })),
);

export function authReducer(state: State | undefined, action: Action) {
  return reducer(state, action);
}
