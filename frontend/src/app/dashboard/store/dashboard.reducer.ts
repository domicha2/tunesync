import { createReducer, on, Action } from '@ngrx/store';

import * as DashboardActions from './dashboard.actions';

export interface DashboardState {
  queuedSongs: DashboardActions.Song[];
  availableSongs: DashboardActions.Song[];
  playedSongs: DashboardActions.Song[];
}

export const initialState: DashboardState = undefined;

const reducer = createReducer(
  initialState,
  on(DashboardActions.storeQueue, (state, action: any) => {
    return { ...state, queuedSongs: action.queue };
  }),
);

export function dashboardReducer(
  state: DashboardState | undefined,
  action: Action,
) {
  return reducer(state, action);
}
