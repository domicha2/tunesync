import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  MatSelectionList,
  MatSelectionListChange,
} from '@angular/material/list';
import { Store } from '@ngrx/store';
import { isArray, isUndefined } from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, filter, map, startWith } from 'rxjs/operators';
import { AppState } from '../../../app.module';
import { User } from '../../../auth/auth.models';
import { getUsersByUsername } from '../../store/dashboard.actions';
import { selectAllUsers } from '../../store/dashboard.selectors';
import { UsersService } from '../users.service';

@Component({
  selector: 'app-users-search-select',
  templateUrl: './users-search-select.component.html',
  styleUrls: ['./users-search-select.component.scss'],
})
export class UsersSearchSelectComponent implements OnInit, OnDestroy {
  @Input() filterByActiveRoom: boolean;
  // intended for two-way binding
  @Input() selectedUsers: User[];
  @ViewChild('selectionList') selectionList: MatSelectionList;

  // input for searching users by username
  username = new FormControl('');

  // list of users to select from
  users$: Observable<User[]>;

  subscription = new Subscription();

  // pagination controls
  prevPage: string;
  nextPage: string;

  constructor(
    private usersService: UsersService,
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.usersService.usersPrevNextSubject.subscribe(({ prev, next }) => {
        this.prevPage = prev;
        this.nextPage = next;
      }),
    );

    this.users$ = this.store.select(selectAllUsers).pipe(
      filter(isArray),
      map(users =>
        users.filter(user =>
          isUndefined(
            this.selectedUsers.find(
              innerUser => innerUser.userId === user.userId,
            ),
          ),
        ),
      ),
      startWith([]),
    );

    this.subscription.add(
      this.username.valueChanges
        .pipe(debounceTime(250), startWith(''))
        .subscribe(username => {
          this.store.dispatch(
            getUsersByUsername({
              username,
              filterByActiveRoom: this.filterByActiveRoom,
              page: '1',
            }),
          );
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getUsers(page: string): void {
    this.store.dispatch(
      getUsersByUsername({
        username: this.username.value,
        filterByActiveRoom: this.filterByActiveRoom,
        page,
      }),
    );
  }

  removeUser(index: number): void {
    const item = this.selectedUsers[index];
    this.selectedUsers.splice(index, 1);
    const selectionListOption = this.selectionList.options.find(
      op => item.userId === op.value.userId,
    );
    if (selectionListOption) {
      selectionListOption.toggle();
    }

    // get a new set of users, so we can show the removed user back onto the list
    this.store.dispatch(
      getUsersByUsername({
        username: this.username.value,
        filterByActiveRoom: this.filterByActiveRoom,
        page: '1',
      }),
    );
  }

  onSelectedUsersChange(event: MatSelectionListChange): void {
    if (event.option.selected) {
      // add this element to the chips list
      this.selectedUsers.push(event.option.value);
    } else {
      // remove this element from the chips list
      const index = this.selectedUsers.findIndex(
        el => el.userId === event.option.value.userId,
      );
      this.selectedUsers.splice(index, 1);
    }
  }
}
