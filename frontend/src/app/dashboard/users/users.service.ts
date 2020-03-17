import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { HttpWrapperService } from '../../http-wrapper.service';
import { EventType, UserChangeAction } from '../dashboard.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  getAllUsers(): Observable<any> {
    return this.httpWrapperService.get('/users/?limit=100');
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

  removeUserFromRoom(roomId: number, userId: number): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      event_type: EventType.UserChange,
      room: roomId,
      args: { type: UserChangeAction.Kick, user: userId },
    });
  }

  createInviteResponseEvent(
    roomId: number,
    response: 'A' | 'R',
  ): Observable<any> {
    let is_accepted: boolean;
    if (response === 'A') {
      is_accepted = true;
    } else if (response === 'R') {
      is_accepted = false;
    }
    return this.httpWrapperService.post('/events/', {
      event_type: EventType.UserChange,
      room: roomId,
      args: { type: 'J', is_accepted },
    });
  }
}
