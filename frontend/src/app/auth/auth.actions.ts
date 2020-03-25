import { createAction, props } from '@ngrx/store';
import { Credentials, User } from './auth.models';

export const signIn = createAction(
  '[Auth Component] Sign In',
  props<Credentials>(),
);
export const signUp = createAction(
  '[Auth Component] Sign Up',
  props<Credentials>(),
);
export const storeUser = createAction('[Auth API] Store User', props<User>());

export const setAuthError = createAction(
  '[Auth API] Set Auth Error',
  props<{ details: string }>(),
);
