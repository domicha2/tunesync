import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpWrapperService } from '../../http-wrapper.service';
import { EventType, FileList2 } from '../dashboard.models';

@Injectable({ providedIn: 'root' })
export class ControlsService {
  songsUploaded = new Subject<number>();

  constructor(private httpWrapperService: HttpWrapperService) {}

  createTunes(tunes: FileList2): Observable<any> {
    const formData: FormData = new FormData();
    for (let i = 0; i < tunes.length; i++) {
      formData.append(i.toString(), tunes[i], tunes[i].name);
    }
    return this.httpWrapperService.post(`/tunes/`, formData);
  }

  createSeekSongEvent(
    roomId: number,
    queueIndex: number,
    timestamp: number,
    isPlaying: boolean,
  ): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      event_type: EventType.TuneSync,
      room: roomId,
      args: {
        play: { queue_index: queueIndex, is_playing: isPlaying, timestamp },
      },
    });
  }

  createPlaySongEvent(
    roomId: number,
    queueIndex: number,
    timestamp: number,
  ): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      event_type: EventType.TuneSync,
      room: roomId,
      args: {
        play: { queue_index: queueIndex, is_playing: true, timestamp },
      },
    });
  }

  createPauseSongEvent(
    roomId: number,
    queueIndex: number,
    timestamp: number,
  ): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      event_type: EventType.TuneSync,
      room: roomId,
      args: {
        play: { queue_index: queueIndex, is_playing: false, timestamp },
      },
    });
  }
}
