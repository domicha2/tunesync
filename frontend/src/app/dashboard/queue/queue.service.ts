import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { HttpWrapperService } from '../../http-wrapper.service';

@Injectable({
  providedIn: 'root',
})
export class QueueService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  getQueue(): Observable<any> {
    return this.httpWrapperService.get('/queue/');
  }

  getAvailableSongs(): Observable<any> {
    return this.httpWrapperService.get('/available-songs/');
  }
}
