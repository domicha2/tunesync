import { createAction, props } from '@ngrx/store';

export interface Song {
  name: string;
  // TODO: add other meta data about song
}

export const getQueue = createAction('[Controls Component] Get Queue');

export const storeQueue = createAction(
  '[Queue API] Store Queue',
  props<{ queue: Song[] }>(),
);
