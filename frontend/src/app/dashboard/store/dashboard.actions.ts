import { createAction, props } from '@ngrx/store';
import {
  AppEvent,
  FileList2,
  Filters,
  Role,
  Room,
  Song,
  User as AuthUser,
  User,
} from '../dashboard.models';
import { Poll } from '../poll/poll.models';

export const resetState = createAction('[Rooms Component] Reset State');

/* Poll/Vote */
export const createPoll = createAction(
  '[Create Poll Component] Create Poll',
  props<{ pollArgs: any }>(),
);

export const createVote = createAction(
  '[Poll Component] Create Vote',
  props<{ pollId: number; agree: boolean }>(),
);

export const getPollsByRoom = createAction(
  '[Rooms Component] Get Polls By Room',
);
export const setPolls = createAction(
  '[Polls API] Set Polls',
  props<{ polls: Poll[] }>(),
);

/* Tunes */
export const getTuneSyncEvent = createAction(
  '[Rooms Component] Get TuneSync Event',
  props<{ roomId: number }>(),
);
export const setTuneSyncEvent = createAction(
  '[Rooms API] Set TuneSync Event',
  props<{ tuneSyncEvent: any }>(),
);

export const setQueueIndex = createAction(
  '[Dashboard Effects] Set Queue Index',
  props<{ queueIndex: number }>(),
);

export const setLastPlayEvent = createAction(
  '[Controls Component] Set Last Play Event',
  props<{ lastPlayEvent: any }>(),
);

export const createPreviousSongEvent = createAction(
  '[Controls Component] Create Previous Song Event',
  props<{ timestamp: number; isPlaying: boolean; queueIndex: number }>(),
);
export const createNextSongEvent = createAction(
  '[Controls Component] Create Next Song Event',
  props<{ timestamp: number; isPlaying: boolean; queueIndex: number }>(),
);
export const createReplaySongEvent = createAction(
  '[Controls Component] Create Replay Song Event',
  props<{ timestamp: number; isPlaying: boolean }>(),
);
export const createForwardSongEvent = createAction(
  '[Controls Component] Create Forward Song Event',
  props<{ timestamp: number; isPlaying: boolean }>(),
);
export const createPlaySongEvent = createAction(
  '[Controls Component] Create Play Song Event',
  props<{ timestamp: number }>(),
);
export const createPauseSongEvent = createAction(
  '[Controls Component] Create Pause Song Event',
  props<{ timestamp: number }>(),
);
export const setSongStatus = createAction(
  '[Main Screen Component] Set Song Status',
  props<{ isPlaying: boolean; seekTime?: number; queueIndex: number }>(),
);

export const createTunes = createAction(
  '[Controls Component] Create Tunes',
  props<{ tunes: FileList2 }>(),
);

export const createModifyQueueEvent = createAction(
  '[Queue Component] Create Modify Queue Event',
  props<{ queue: number[] }>(),
);

export const storeQueue = createAction(
  '[Queue API] Store Queue',
  props<{ queue: Song[] }>(),
);

export const getAvailableSongs = createAction(
  '[Queue Component] Get Available Songs',
  props<{
    filters: Filters;
  }>(),
);

export const storeAvailableSongs = createAction(
  '[Queue API] Store Available Songs',
  props<{ availableSongs: Song[] }>(),
);

// combination of queue and available songs
export const storeSongs = createAction(
  '[Queue Component] Store Songs',
  props<{
    queuedSongs: Song[];
    availableSongs: Song[];
  }>(),
);

/* Rooms */
export const createRoom = createAction(
  '[Add Room Component] Add Room',
  props<{ room: Room; users: number[] }>(),
);
export const getRooms = createAction('[Auth Component] Get Rooms');
export const storeRooms = createAction(
  '[Rooms API] Store Rooms',
  props<{ rooms: Room[] }>(),
);
export const setActiveRoom = createAction(
  '[Rooms Component] Set Active Room',
  props<{ activeRoomId: number; activeRoomName: string }>(),
);

export const getUsersByRoom = createAction(
  '[Rooms Component] Get Users By Room',
  props<{ roomId: number }>(),
);
export const storeUsers = createAction(
  '[Rooms API] Store Users',
  props<{ users: User[] }>(),
);
export const removeUserFromRoom = createAction(
  '[Kick User Component] Remove User From Room',
  props<{ userId: number }>(),
);

/* Messaging */
export const createMessage = createAction(
  '[Messaging Component] Create Message',
  props<{ message: string }>(),
);

export const getEventsByRoom = createAction(
  '[Rooms Component] Get Events By Room',
  props<{ roomId: number; creationTime: Date }>(),
);
export const storeEvents = createAction(
  '[Events API] Store Events',
  props<{ events: AppEvent[]; loadMore: boolean }>(),
);

/* Users */
export const getUsersByUsername = createAction(
  '[Add Room Component] Get Users By Username',
  props<{ username: string; filterByActiveRoom: boolean }>(),
);
export const storeAllUsers = createAction(
  '[Users API] Store All Users',
  // ! the import is pointing to the wrong interface
  props<{ allUsers: AuthUser[] }>(),
);
export const createInviteUsersEvent = createAction(
  '[Dashboard Effect] Create Invite Users Event',
  props<{ users: number[]; roomId: number }>(),
);

export const createInviteResponseEvent = createAction(
  '[Main Screen Component] Create Invite Response Event',
  props<{ roomId: number; response: 'A' | 'R' }>(),
);

export const createRoleChangeEvent = createAction(
  '[Users Component] Create Role Change Event',
  props<{ userId: number; role: 'A' | 'D' | 'R' }>(),
);

export const setUserRole = createAction(
  '[Users API] Set User Role',
  props<{ userRole: Role }>(),
);
