import { createSelector } from '@ngrx/store';

import { AppState } from './app.module';

export const selectUserAndRoom = createSelector(
  (state: AppState) => (state && state.auth ? state.auth.userId : undefined),
  (state: AppState) =>
    state && state.dashboard ? state.dashboard.activeRoomId : undefined,
  (userId, roomId) => ({ userId, roomId }),
);
