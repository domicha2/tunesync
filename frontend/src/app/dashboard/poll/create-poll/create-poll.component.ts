import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { AppState } from '../../../app.module';
import {
  Filters,
  Role,
  Song,
  User,
  UserChangeAction,
} from '../../dashboard.models';
import * as DashboardActions from '../../store/dashboard.actions';
import {
  selectAvailableSongs,
  selectUsers,
} from '../../store/dashboard.selectors';
import { PollType } from '../poll.models';

@Component({
  selector: 'app-create-poll',
  templateUrl: './create-poll.component.html',
  styleUrls: ['./create-poll.component.scss'],
})
export class CreatePollComponent implements OnInit, OnDestroy {
  subscription = new Subscription();

  regularUsers$: Observable<User[]>;
  availableSongs$: Observable<Song[]>;

  pollTypes: any[] = [
    { name: 'Add Song to Queue', enum: PollType.AddToQueue },
    { name: 'Kick User', enum: PollType.Kick },
  ];

  pollType = new FormControl(null, Validators.required);
  userId = new FormControl(null, Validators.required);
  songId = new FormControl(null, Validators.required);

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    // get a list of filtered songs
    this.availableSongs$ = this.store
      .select(selectAvailableSongs)
      .pipe(tap(songs => console.log(songs)));

    // get a list of users in the current room
    this.regularUsers$ = this.store.select(selectUsers).pipe(
      map((users: User[]) => users.filter(user => user.role === Role.Regular)),
      tap(users => console.log('users', users)),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onCreatePoll(): void {
    switch (this.pollType.value) {
      case PollType.AddToQueue:
        this.store.dispatch(
          DashboardActions.createPoll({
            pollArgs: {
              action: this.pollType.value,
              song: this.songId.value,
            },
          }),
        );
        break;
      case PollType.Kick:
        this.store.dispatch(
          DashboardActions.createPoll({
            pollArgs: {
              action: this.pollType.value,
              type: UserChangeAction.Kick,
              user: this.userId.value,
            },
          }),
        );
        break;
      default:
        console.error('bad poll type');
    }
  }
}
