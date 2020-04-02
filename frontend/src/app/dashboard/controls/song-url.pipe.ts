import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Song } from '../dashboard.models';

@Pipe({ name: 'songUrl' })
export class SongUrlPipe implements PipeTransform {
  transform(currentSong: Song): string | undefined {
    if (currentSong === undefined) {
      return undefined;
    } else {
      return `${environment.url}/tunes/${currentSong.id}/data/`;
    }
  }
}
