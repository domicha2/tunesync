import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpWrapperService } from '../../http-wrapper.service';
import { EventType } from '../dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class QueueService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  getAvailableSongs(): Observable<any> {
    return this.httpWrapperService.get('/tunes/');
  }

  createModifyQueueEvent(queue: number[], roomId: number): Observable<any> {
    return this.httpWrapperService.post(`/events/`, {
      room: roomId,
      args: { modify_queue: { queue } },
      event_type: EventType.TuneSync,
    });
  }
}
