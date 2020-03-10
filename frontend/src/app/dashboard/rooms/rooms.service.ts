import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { HttpWrapperService } from '../../http-wrapper.service';
import { Room } from '../dashboard.models';

@Injectable({ providedIn: 'root' })
export class RoomsService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  getRooms(): Observable<any> {
    return this.httpWrapperService.get('/rooms/');
  }

  createRoom(room: Room): Observable<any> {
    return this.httpWrapperService.post('/rooms/', {
      title: room.name,
      subtitle: room.subtitle,
    });
  }
}
