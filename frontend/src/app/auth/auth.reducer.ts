import { Action, createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { User } from './auth.models';

export interface AuthState {
  user: User;
  errorMessage: string;
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
  on(AuthActions.setAuthError, (state, action) => {
    return {
      ...state,
      errorMessage: action.details,
    };
  }),
);

export function authReducer(state: AuthState | undefined, action: Action) {
  return reducer(state, action);
}
