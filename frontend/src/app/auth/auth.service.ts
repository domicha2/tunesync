import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { HttpWrapperService } from '../http-wrapper.service';

import { Credentials } from './auth.actions';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  signIn(credentials: Credentials): Observable<any> {
    return this.httpWrapperService.post('/get-token/', credentials);
  }

  signUp(credentials: Credentials): Observable<any> {
    return this.httpWrapperService.post('/users/', credentials);
  }
}
