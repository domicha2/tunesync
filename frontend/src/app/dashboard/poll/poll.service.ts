import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpWrapperService } from '../../http-wrapper.service';
import { EventType } from '../dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class PollService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  createPoll(room: number, args: any): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      room,
      event_type: EventType.CreatePoll,
      args,
    });
  }
}
