import { createReducer, on, Action } from '@ngrx/store';

import * as DashboardActions from './dashboard.actions';
import { Song, Room, User, AppEvent } from '../dashboard.models';
import { User as AuthUser } from '../../auth/auth.models';

export interface DashboardState {
  queuedSongs: Song[];
  availableSongs: Song[];
  playedSongs: Song[];
  rooms: Room[];
  // users in a room
  users: User[];
  activeRoomId: number;
  events: AppEvent[];
  // users in the application
  allUsers: AuthUser[];
  isPlaying: boolean;
  seekTime: number;
  lastPlayEvent: any;
  queueIndex: number;
  tuneSyncEvent: any;
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
  on(DashboardActions.storeUsers, (state, action) => {
    return {
      ...state,
      users: action.users,
    };
  }),
  on(DashboardActions.setActiveRoom, (state, action) => {
    return {
      ...state,
      activeRoomId: action.activeRoomId,
    };
  }),
  on(DashboardActions.storeEvents, (state, action) => {
    return {
      ...state,
      events: action.events,
    };
  }),
  on(DashboardActions.storeAllUsers, (state, action: any) => {
    return {
      ...state,
      allUsers: action.allUsers,
    };
  }),
  on(DashboardActions.setSongStatus, (state, action) => {
    return {
      ...state,
      isPlaying: action.isPlaying,
      seekTime: action.seekTime,
      queueIndex: action.queueIndex,
    };
  }),
  on(DashboardActions.setLastPlayEvent, (state, action) => {
    return {
      ...state,
      lastPlayEvent: action.lastPlayEvent,
    };
  }),
  on(DashboardActions.setQueueIndex, (state, action) => {
    return {
      ...state,
      queueIndex: action.queueIndex,
    };
  }),
  on(DashboardActions.setTuneSyncEvent, (state, action) => {
    return {
      ...state,
      tuneSyncEvent: action.tuneSyncEvent,
    };
  }),
);

export function dashboardReducer(
  state: DashboardState | undefined,
  action: Action,
) {
  return reducer(state, action);
}
