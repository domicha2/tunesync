import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpWrapperService } from '../../http-wrapper.service';
import { EventType } from '../dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class PollService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  getPollsByRoom(roomId: number): Observable<any> {
    return this.httpWrapperService.get(`/rooms/${roomId}/polls/`);
  }

  createPoll(room: number, args: any): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      room,
      event_type: EventType.CreatePoll,
      args,
    });
  }

  createVote(room: number, pollId: number, agree: boolean): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      room,
      event_type: EventType.Vote,
      parent_event: pollId,
      args: {
        agree,
      },
    });
  }
}
