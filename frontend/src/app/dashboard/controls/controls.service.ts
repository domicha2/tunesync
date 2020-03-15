import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpWrapperService } from '../../http-wrapper.service';
import { EventType } from '../dashboard.models';

@Injectable({ providedIn: 'root' })
export class ControlsService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  createTune(tune: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', tune, tune.name);
    return this.httpWrapperService.post(`/tunes/`, formData);
  }

  createPlaySongEvent(roomId: number): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      event_type: EventType.Play,
      room: roomId,
      args: { isPlaying: true },
    });
  }

  createPauseSongEvent(roomId: number): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      event_type: EventType.Play,
      room: roomId,
      args: { isPlaying: false },
    });
  }
}
