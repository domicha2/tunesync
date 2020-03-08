import { createSelector } from '@ngrx/store';

import { AppState } from '../../app.module';
import { DashboardState } from './dashboard.reducer';

export const selectQueuedSongs = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) =>
    dashboard ? dashboard.queuedSongs.slice() : undefined,
);
