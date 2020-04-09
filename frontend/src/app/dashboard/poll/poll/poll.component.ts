import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../app.module';
import * as DashboardActions from '../../store/dashboard.actions';
import { PollType } from '../poll.models';

@Component({
  selector: 'app-poll',
  templateUrl: './poll.component.html',
  styleUrls: ['./poll.component.scss'],
})
export class PollComponent {
  @Input() pollId: number;
  @Input() pollType: PollType;

  constructor(private store: Store<AppState>) {}

  onVote(agree: boolean): void {
    this.store.dispatch(
      DashboardActions.createVote({ pollId: this.pollId, agree }),
    );
  }
}