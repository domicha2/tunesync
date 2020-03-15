import { createReducer, on, Action } from '@ngrx/store';

import * as AuthActions from './auth.actions';
import { User } from './auth.models';

export interface AuthState {
  user: User;
}

export const initialState: AuthState = undefined;

const reducer = createReducer(
  initialState,
  on(AuthActions.storeUser, (state, action: any) => {
    return {
      ...state,
      user: action.user,
    };
  }),
);

export function authReducer(state: AuthState | undefined, action: Action) {
  return reducer(state, action);
}
