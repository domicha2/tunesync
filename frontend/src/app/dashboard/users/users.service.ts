import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { HttpWrapperService } from '../../http-wrapper.service';
import { EventType, UserChangeAction } from '../dashboard.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  getAllUsers(): Observable<any> {
    return this.httpWrapperService.get('/users/');
  }

  createInviteUsersEvent(users: number[], roomId: number): Observable<any> {
    return this.httpWrapperService.post(`/events/`, {
      args: { users, type: UserChangeAction.Invite },
      event_type: EventType.UserChange,
      room: roomId,
    });
  }

  getUsersByRoom(roomId: number): Observable<any> {
    return this.httpWrapperService.get(`/rooms/${roomId}/users/`);
  }

  removeUserFromRoom(membershipId: number): Observable<any> {
    return this.httpWrapperService.delete(`/memberships/${membershipId}/`);
  }
}
