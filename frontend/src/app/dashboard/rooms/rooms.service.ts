import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../app.module';
import { HttpWrapperService } from '../../http-wrapper.service';
import { Room } from '../dashboard.models';
import {
  getEventsByRoom,
  getTuneSyncEvent,
  getUsersByRoom,
  resetState,
  setActiveRoom,
} from '../store/dashboard.actions';
import { NotificationsService } from '../notifications.service';

@Injectable({ providedIn: 'root' })
export class RoomsService {
  constructor(
    private store: Store<AppState>,
    private notificationsService: NotificationsService,
    private httpWrapperService: HttpWrapperService,
  ) {}

  getRooms(userId: number): Observable<any> {
    return this.httpWrapperService.get(`/users/${userId}/rooms/`);
  }

  createRoom(room: Room): Observable<any> {
    return this.httpWrapperService.post('/rooms/', room);
  }

  getTuneSyncEvent(roomId: number): Observable<any> {
    return this.httpWrapperService.get(`/rooms/${roomId}/tunesync/`);
  }

  enterRoom(roomId: number, roomTitle: string): void {
    this.store.dispatch(resetState());
    this.store.dispatch(
      setActiveRoom({
        activeRoomId: roomId,
        activeRoomName: roomTitle,
      }),
    );
    this.notificationsService.notificationsSubject.next({
      roomId,
      action: 'reset',
    });
    this.store.dispatch(getUsersByRoom({ roomId }));
    this.store.dispatch(
      getEventsByRoom({
        roomId,
        creationTime: new Date(),
      }),
    );
    this.store.dispatch(getTuneSyncEvent({ roomId }));
  }
}
