import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { HttpWrapperService } from '../../http-wrapper.service';
import { EventType } from '../dashboard.models';
import { NotificationsService } from '../notifications.service';
import { Poll, PollType } from './poll.models';

@Injectable({
  providedIn: 'root',
})
export class PollService {
  constructor(
    private matSnackBar: MatSnackBar,
    private notificationsService: NotificationsService,
    private httpWrapperService: HttpWrapperService,
  ) {}

  processFinishedPoll(poll: Poll, roomId: number): void {
    if (poll.room_id !== roomId) {
      this.notificationsService.notificationsSubject.next({
        roomId: poll.room_id,
        action: 'increment',
      });
    } else {
      let snackBarMessage = '';
      if (poll.is_successful) {
        snackBarMessage += 'Poll got enough votes to pass: ';
        if (poll.args.action === PollType.AddToQueue) {
          snackBarMessage += `Added ${poll.args.song_name} to the queue.`;
        } else if (poll.args.action === PollType.Kick) {
          snackBarMessage += `Kicked ${poll.args.username}.`;
        }
      } else {
        snackBarMessage += 'Poll did not get enough votes to pass: ';
        if (poll.args.action === PollType.AddToQueue) {
          snackBarMessage += `${poll.args.song_name} did not get added to the queue.`;
        } else if (poll.args.action === PollType.Kick) {
          snackBarMessage += `Did not kick ${poll.args.username}.`;
        }
      }
      // open snackbar
      this.matSnackBar.open(snackBarMessage, undefined, {
        duration: 5000,
      });
    }
  }

  getPollsByRoom(roomId: number): Observable<any> {
    return this.httpWrapperService.get(`/rooms/${roomId}/polls/`);
  }

  createPoll(room: number, args: any): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      room,
      event_type: EventType.CreatePoll,
      args,
    });
  }

  createVote(room: number, pollId: number, agree: boolean): Observable<any> {
    return this.httpWrapperService.post('/events/', {
      room,
      event_type: EventType.Vote,
      parent_event: pollId,
      args: {
        agree,
      },
    });
  }
}
