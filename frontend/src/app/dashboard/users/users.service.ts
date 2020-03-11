import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { HttpWrapperService } from '../../http-wrapper.service';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  getUsersByRoom(roomId: number): Observable<any> {
    return this.httpWrapperService.get(`/rooms/${roomId}/users/`);
  }

  removeUserFromRoom(roomId: number, userId: number): Observable<any> {
    return this.httpWrapperService.delete(`/rooms/${roomId}/users/${userId}/`);
  }
}
