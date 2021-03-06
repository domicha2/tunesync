import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpWrapperService } from '../../http-wrapper.service';
import { EventType, UserChangeAction } from '../dashboard.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  usersPrevNextSubject = new BehaviorSubject<{
    prev: string;
    next: string;
  }>({ prev: null, next: null });

  constructor(private httpWrapperService: HttpWrapperService) {}

  createRoleChangeEvent(
    userId: number,
    roomId: number,
    role: 'A' | 'D' | 'R',
  ): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      room: roomId,
      args: {
        type: 'C',
        user: userId,
        role,
      },
      event_type: EventType.UserChange,
    });
  }

  getUsersByUsername(username: string, page: string): Observable<any> {
    return this.httpWrapperService.get('/users/', {
      username__icontains: username,
      page,
    });
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
    let isAccepted: boolean;
    if (response === 'A') {
      isAccepted = true;
    } else if (response === 'R') {
      isAccepted = false;
    }
    return this.httpWrapperService.post('/events/', {
      event_type: EventType.UserChange,
      room: roomId,
      args: { type: 'J', is_accepted: isAccepted },
    });
  }
}
