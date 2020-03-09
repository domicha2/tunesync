import { createReducer, on, Action } from '@ngrx/store';

import * as DashboardActions from './dashboard.actions';

export interface DashboardState {
  queuedSongs: DashboardActions.Song[];
  availableSongs: DashboardActions.Song[];
  playedSongs: DashboardActions.Song[];
  rooms: DashboardActions.Room[];
}

export const initialState: DashboardState = undefined;

const reducer = createReducer(
  initialState,
  on(DashboardActions.storeQueue, (state, action: any) => {
    return { ...state, queuedSongs: action.queue };
  }),
  on(DashboardActions.storeAvailableSongs, (state, action: any) => {
    return { ...state, availableSongs: action.availableSongs };
  }),
  on(DashboardActions.storeSongs, (state, action: any) => {
    return {
      ...state,
      availableSongs: action.availableSongs,
      queuedSongs: action.queuedSongs,
    };
  }),
  on(DashboardActions.addAvailableSong, (state, action) => {
    state.availableSongs.push(action.song);
    return state;
  }),
  on(DashboardActions.storeRooms, (state, action) => {
    return {
      ...state,
      rooms: action.rooms,
    };
  }),
);

export function dashboardReducer(
  state: DashboardState | undefined,
  action: Action,
) {
  return reducer(state, action);
}
