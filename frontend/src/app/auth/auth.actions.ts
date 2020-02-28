import { createAction, props } from '@ngrx/store';

export interface Credentials {
  username: string;
  password: string;
}

export interface User {
  username: string;
}

export const signIn = createAction(
  '[Auth Component] Sign In',
  props<Credentials>(),
);
export const signUp = createAction(
  '[Auth Component] Sign Up',
  props<Credentials>(),
);
export const storeUser = createAction('[Auth API] Store User', props<User>());
