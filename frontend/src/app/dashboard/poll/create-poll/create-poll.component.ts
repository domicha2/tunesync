import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../app.module';
import { User, Role } from '../../dashboard.models';
import { selectUsers } from '../../store/dashboard.selectors';
import { tap, map } from 'rxjs/operators';

@Component({
  selector: 'app-create-poll',
  templateUrl: './create-poll.component.html',
  styleUrls: ['./create-poll.component.scss'],
})
export class CreatePollComponent implements OnInit {
  testVariable = 'Hello Michael!';

  regularUsers$: Observable<User[]>;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    // get a list of users in the current room
    this.regularUsers$ = this.store.select(selectUsers).pipe(
      map((users: User[]) => users.filter(user => user.role === Role.Regular)),
      tap(users => console.log('users', users)),
    );
  }
}
