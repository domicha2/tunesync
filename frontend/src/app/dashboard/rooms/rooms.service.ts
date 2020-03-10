import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { HttpWrapperService } from '../../http-wrapper.service';

@Injectable({ providedIn: 'root' })
export class RoomsService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  getRooms(): Observable<any> {
    return this.httpWrapperService.get('/rooms/');
  }
}
