import { createSelector } from '@ngrx/store';

import { AppState } from '../../app.module';
import { DashboardState } from './dashboard.reducer';

export const selectQueuedSongs = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) =>
    dashboard && dashboard.queuedSongs
      ? dashboard.queuedSongs.slice()
      : undefined,
);

export const selectAvailableSongs = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) =>
    dashboard && dashboard.availableSongs
      ? dashboard.availableSongs.slice()
      : undefined,
);

export const selectRooms = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) =>
    dashboard && dashboard.rooms
      ? dashboard.rooms.slice()
      : undefined,
);

export const selectUsers = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) =>
    dashboard && dashboard.users ? dashboard.users.slice() : undefined,
);
