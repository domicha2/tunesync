import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpWrapperService } from '../../http-wrapper.service';
import { EventType, Filters } from '../dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class QueueService {
  availSongsPrevNextSubject = new BehaviorSubject<{
    prev: string;
    next: string;
  }>({ prev: null, next: null });

  constructor(private httpWrapperService: HttpWrapperService) {}

  getAvailableSongs(filters: Filters, page: string): Observable<any> {
    const queryParams = { page };
    for (const key in filters) {
      if (filters[key] !== '') {
        queryParams[`${key}__icontains`] = filters[key];
      }
    }
    return this.httpWrapperService.get('/tunes/', queryParams);
  }

  createModifyQueueEvent(queue: number[], roomId: number): Observable<any> {
    return this.httpWrapperService.post(`/events/`, {
      room: roomId,
      args: { modify_queue: { queue } },
      event_type: EventType.TuneSync,
    });
  }
}
