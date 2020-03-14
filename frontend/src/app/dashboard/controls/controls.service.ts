import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpWrapperService } from '../../http-wrapper.service';

@Injectable({ providedIn: 'root' })
export class ControlsService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  createTune(tune: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', tune, tune.name);
    return this.httpWrapperService.post(`/tunes/`, formData);
  }
}
