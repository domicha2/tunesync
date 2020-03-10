import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { HttpWrapperService } from '../../http-wrapper.service';
import { Message } from '../dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class MessagingService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  createMessage(message: Message): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      room_id: message.roomId,
      author: message.userId,
      parent_event_id: null,
      args: message.content,
      event_type: 'M',
    });
  }
}
