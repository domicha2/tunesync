import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpWrapperService } from '../../http-wrapper.service';

@Injectable({ providedIn: 'root' })
export class MainScreenService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  getEventsByRoom(roomId: number, creationTime: Date): Observable<any> {
    return this.httpWrapperService.get(`/rooms/${roomId}/events/`, {
      creation_time__lt: creationTime.toISOString(),
    });
  }
}
