import { createAction, props } from '@ngrx/store';

import { Song, User, Room, AppEvent } from '../dashboard.models';

/* Tunes */
export const createTune = createAction(
  '[Controls Component] Create Tune',
  props<{ tune: File }>(),
);

export const getQueue = createAction('[Controls Component] Get Queue');

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
  props<{ room: Room }>(),
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
  props<{ membershipId: number }>(),
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
