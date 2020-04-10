import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, filter, startWith } from 'rxjs/operators';
import { AppState } from '../../../app.module';
import { User } from '../../../auth/auth.models';
import { PERSONAL_ROOM_NAME } from '../../dashboard.models';
import * as DashboardActions from '../../store/dashboard.actions';
import { selectAllUsers } from '../../store/dashboard.selectors';

@Component({
  selector: 'app-add-room',
  templateUrl: './add-room.component.html',
  styleUrls: ['./add-room.component.scss'],
})
export class AddRoomComponent implements OnInit, OnDestroy {
  subscription = new Subscription();
  allUsers$: Observable<User[]>;
  users = new FormControl();
  usernameControl = new FormControl('');

  roomForm = new FormGroup({
    title: new FormControl(null, [
      Validators.required,
      this.roomTitleValidator,
    ]),
    subtitle: new FormControl(),
  });

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.subscription.add(
      this.usernameControl.valueChanges
        .pipe(
          startWith(''),
          debounceTime(250),
        )
        .subscribe((username: string) => {
          this.store.dispatch(
            DashboardActions.getUsersByUsername({
              username,
              filterByActiveRoom: false,
            }),
          );
        }),
    );

    this.allUsers$ = this.store.select(selectAllUsers).pipe(
      filter(users => users !== undefined),
      startWith([]),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onAddRoom(): void {
    this.store.dispatch(
      DashboardActions.createRoom({
        room: this.roomForm.value,
        users: this.users.value,
      }),
    );
  }

  private roomTitleValidator(
    control: AbstractControl,
  ): { [key: string]: any } | null {
    return control.value === PERSONAL_ROOM_NAME
      ? { forbiddenName: { value: control.value } }
      : null;
  }
}
