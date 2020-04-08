import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
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

  nameControl = new FormControl('');
  albumControl = new FormControl('');
  artistControl = new FormControl('');

  pollType: PollType;
  pollTypes: any[] = [
    { name: 'Add Song to Queue', enum: PollType.AddToQueue },
    { name: 'Kick User', enum: PollType.Kick },
  ];

  selectedUserId: number;
  selectedSongId: number;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.subscription.add(
      combineLatest([
        this.nameControl.valueChanges.pipe(startWith('')),
        this.albumControl.valueChanges.pipe(startWith('')),
        this.artistControl.valueChanges.pipe(startWith('')),
      ])
        .pipe(
          debounceTime(250),
          map(([name, album, artist]) => ({
            name,
            album,
            artist,
          })),
        )
        .subscribe((filters: Filters) => {
          this.store.dispatch(DashboardActions.getAvailableSongs({ filters }));
        }),
    );

    // get a list of filtered songs
    this.availableSongs$ = this.store
      .select(selectAvailableSongs)
      .pipe(tap((songs) => console.log(songs)));

    // get a list of users in the current room
    this.regularUsers$ = this.store.select(selectUsers).pipe(
      map((users: User[]) =>
        users.filter((user) => user.role === Role.Regular),
      ),
      tap((users) => console.log('users', users)),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onCreatePoll(): void {
    switch (this.pollType) {
      case PollType.AddToQueue:
        this.store.dispatch(
          DashboardActions.createPoll({
            pollArgs: {
              action: this.pollType,
              song: this.selectedSongId,
            },
          }),
        );
        break;
      case PollType.Kick:
        this.store.dispatch(
          DashboardActions.createPoll({
            pollArgs: {
              action: this.pollType,
              type: UserChangeAction.Kick,
              user: this.selectedUserId,
            },
          }),
        );
        break;
      default:
        console.error('bad poll type');
    }
  }
}
