import { createAction, props } from '@ngrx/store';

import { Song, User, Room, AppEvent } from '../dashboard.models';
import { User as AuthUser } from '../dashboard.models';

/* Tunes */
export const createReplaySongEvent = createAction(
  '[Controls Component] Create Replay Song Event',
  props<{}>(),
);
export const createForwardSongEvent = createAction(
  '[Controls Component] Create Forward Song Event',
  props<{}>(),
);
export const createPlaySongEvent = createAction(
  '[Controls Component] Create Play Song Event',
  props<{ something: any }>(),
);
export const createPauseSongEvent = createAction(
  '[Controls Component] Create Pause Song Event',
  props<{ something: any }>(),
);
export const setSongStatus = createAction(
  '[Main Screen Component] Set Song Status',
  props<{ isPlaying: boolean; seekTime?: number }>(),
);

export const createTune = createAction(
  '[Controls Component] Create Tune',
  props<{ tune: File }>(),
);

export const createModifyQueueEvent = createAction(
  '[Queue Component] Create Modify Queue Event',
  props<{ queue: Song[] }>(),
);

export const storeQueue = createAction(
  '[Queue API] Store Queue',
  props<{ queue: Song[] }>(),
);

export const getAvailableSongs = createAction(
  '[Queue Component] Get Available Songs',
);

export const addAvailableSong = createAction(
  '[Controls Component] Add Available Song',
  props<{ song: Song }>(),
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
  props<{ activeRoomId: number }>(),
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
  props<{ roomId: number }>(),
);
export const storeEvents = createAction(
  '[Events API] Store Events',
  props<{ events: AppEvent[] }>(),
);

/* Users */
export const getAllUsers = createAction('[Rooms Component] Get All Users');
export const storeAllUsers = createAction(
  '[Users API] Store All Users',
  props<{ allUsers: AuthUser[] }>(),
);
export const createInviteUsersEvent = createAction(
  '[Dashboard Effect] Create Invite Users Event',
  props<{ users: number[]; roomId: number }>(),
);
