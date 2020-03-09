import { createAction, props } from '@ngrx/store';

export interface Song {
  name: string;
  // TODO: add other meta data about song
}

export type Role = 'Admin' | 'DJ' | 'Regular';

export interface Room {
  id: number;
  name: string;
  role: Role;
}

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

export const getRooms = createAction('[Auth Component] Get Rooms');
export const storeRooms = createAction(
  '[Rooms API] Store Rooms',
  props<{ rooms: Room[] }>(),
);
