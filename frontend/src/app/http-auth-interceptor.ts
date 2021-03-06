import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { AppState } from './app.module';
import { selectToken } from './auth/auth.selectors';

@Injectable()
export class HttpAuthInterceptor implements HttpInterceptor {
  constructor(private store: Store<AppState>) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return this.store.select(selectToken).pipe(
      first(),
      switchMap(token => {
        if (token) {
          const authReq = req.clone({
            headers: req.headers.set('Authorization', `Token ${token}`),
          });
          return next.handle(authReq);
        } else {
          return next.handle(req);
        }
      }),
    );
  }
}
