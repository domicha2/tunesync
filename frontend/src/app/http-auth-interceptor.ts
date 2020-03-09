import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpEvent,
  HttpRequest,
} from '@angular/common/http';

import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import { AppState } from './app.module';
import { switchMap, tap, first } from 'rxjs/operators';

@Injectable()
export class HttpAuthInterceptor implements HttpInterceptor {
  constructor(private store: Store<AppState>) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return this.store.select('auth').pipe(
      first(),
      switchMap(data => {
        if (data && data.token) {
          const authReq = req.clone({
            headers: req.headers.set('Authorization', data.token),
          });
          return next.handle(authReq);
        } else {
          return next.handle(req);
        }
      }),
    );
  }
}
