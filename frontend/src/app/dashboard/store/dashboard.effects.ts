import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import * as DashboardActions from './dashboard.actions';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class DashboardEffects {
  getQueue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getQueue),
      switchMap(() =>
        this.queueService.getQueue().pipe(
          map((queuedSongs: DashboardActions.Song[]) => ({
            type: DashboardActions.storeQueue.type,
            queue: queuedSongs,
          })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  getAvailableSongs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.getAvailableSongs),
      switchMap(() =>
        this.queueService.getAvailableSongs().pipe(
          map((availableSongs: DashboardActions.Song[]) => ({
            type: DashboardActions.storeAvailableSongs.type,
            availableSongs,
          })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  constructor(private actions$: Actions, private queueService: QueueService) {}
}