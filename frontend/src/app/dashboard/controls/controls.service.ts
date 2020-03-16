import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpWrapperService } from '../../http-wrapper.service';
import { EventType } from '../dashboard.models';

@Injectable({ providedIn: 'root' })
export class ControlsService {
  constructor(private httpWrapperService: HttpWrapperService) {}

  createTunes(tunes: FileList): Observable<any> {
    const formData: FormData = new FormData();
    for (let i = 0; i < tunes.length; i++) {
      formData.append(i.toString(), tunes[i], tunes[i].name);
    }
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
