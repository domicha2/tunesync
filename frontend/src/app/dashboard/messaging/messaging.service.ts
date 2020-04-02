import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpWrapperService } from '../../http-wrapper.service';
import { EventType, Message } from '../dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class MessagingService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  createMessage(message: Message): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      room: message.roomId,
      args: { content: message.content },
      event_type: EventType.Messaging,
    });
  }
}
