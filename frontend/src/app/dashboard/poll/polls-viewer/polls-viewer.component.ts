import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { AppState } from '../../../app.module';
import { getPollsByRoom } from '../../store/dashboard.actions';
import { selectPolls } from '../../store/dashboard.selectors';
import { Poll, PollState } from '../poll.models';
import { WebSocketService } from '../../web-socket.service';

@Component({
  selector: 'app-polls-viewer',
  templateUrl: './polls-viewer.component.html',
  styleUrls: ['./polls-viewer.component.scss'],
})
export class PollsViewerComponent implements OnInit, OnDestroy {
  subscription = new Subscription();

  pollState: PollState = {};
  // used by ngFor instead of iterate over pollState
  pollIds: number[] = [];

  constructor(
    private webSocketService: WebSocketService,
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.webSocketService.pollsSubject.subscribe((poll: Poll) => {
        if (this.pollState[poll.poll_id] === undefined) {
          // add new entry to the view
          this.pollIds.push(poll.poll_id);
        }
        // update the state
        this.pollState[poll.poll_id] = poll;
      }),
    );

    this.subscription.add(
      this.store
        .select(selectPolls)
        // ignore the initial value, let the api request override it
        .pipe(skip(1))
        .subscribe((polls: Poll[]) => {
          // clear the poll
          this.pollState = {};
          this.pollIds = [];

          // iterate over the polls and set the poll state
          polls.forEach((poll: Poll) => {
            this.pollState[poll.poll_id] = poll;
            this.pollIds.push(poll.poll_id);
          });
        }),
    );

    this.store.dispatch(getPollsByRoom());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  trackByPollId(index: number, item: number): number {
    return item;
  }
}
