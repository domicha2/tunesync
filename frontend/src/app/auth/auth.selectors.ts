import { createSelector } from '@ngrx/store';

import { AppState } from '../app.module';
import { AuthState } from './auth.reducer';

export const selectUserId = createSelector(
  (state: AppState) => state.auth,
  (auth: AuthState) => (auth && auth.user ? auth.user.userId : undefined),
);

export const selectToken = createSelector(
  (state: AppState) => state.auth,
  (auth: AuthState) => (auth && auth.user ? auth.user.token : undefined),
);
