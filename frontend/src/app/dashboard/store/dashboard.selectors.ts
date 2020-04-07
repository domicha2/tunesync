import { createSelector } from '@ngrx/store';
import { AppState } from '../../app.module';
import { DashboardState } from './dashboard.reducer';

export const selectLoadMore = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) => (dashboard ? dashboard.loadMore : undefined),
);

export const selectQueuedSongs = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) =>
    dashboard ? dashboard.queuedSongs : undefined,
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
    dashboard && dashboard.rooms ? dashboard.rooms.slice() : undefined,
);

export const selectUsers = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) =>
    dashboard && dashboard.users ? dashboard.users.slice() : undefined,
);

export const selectEvents = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) => (dashboard ? dashboard.events : undefined),
);

export const selectActiveRoom = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) =>
    dashboard ? dashboard.activeRoomId : undefined,
);

export const selectAllUsers = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) =>
    dashboard && dashboard.allUsers ? dashboard.allUsers.slice() : undefined,
);

export const selectIsPlaying = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) => (dashboard ? dashboard.isPlaying : undefined),
);

export const selectSeekTime = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) => (dashboard ? dashboard.seekTime : undefined),
);

export const selectLastPlayEvent = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) =>
    dashboard ? dashboard.lastPlayEvent : undefined,
);

export const selectQueueIndex = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) => (dashboard ? dashboard.queueIndex : undefined),
);

export const selectQueueIndexAndRoom = createSelector(
  selectQueueIndex,
  selectActiveRoom,
  (index, room) => ({ index, room }),
);

export const selectQueueIndexAndSongs = createSelector(
  selectQueueIndex,
  selectQueuedSongs,
  (index, songs) => ({ index, songs }),
);

export const selectTuneSyncEvent = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) =>
    dashboard ? dashboard.tuneSyncEvent : undefined,
);

export const selectSongStatus = createSelector(
  selectIsPlaying,
  selectSeekTime,
  selectQueueIndex,
  (isPlaying, seekTime, queueIndex) => ({ isPlaying, seekTime, queueIndex }),
);

export const selectActiveRoomName = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) =>
    dashboard ? dashboard.activeRoomName : undefined,
);

export const selectUserRole = createSelector(
  (state: AppState) => state.dashboard,
  (dashboard: DashboardState) => (dashboard ? dashboard.userRole : undefined),
);
