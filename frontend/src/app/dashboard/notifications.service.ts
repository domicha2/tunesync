import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class NotificationsService {
  notificationsSubject = new Subject<{
    roomId: number;
    action: 'increment' | 'reset';
  }>();
}
