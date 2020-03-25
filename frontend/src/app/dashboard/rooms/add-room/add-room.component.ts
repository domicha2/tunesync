import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { Store } from '@ngrx/store';

import { AppState } from '../../../app.module';
import * as DashboardActions from '../../store/dashboard.actions';
import { Observable } from 'rxjs';
import { User } from '../../../auth/auth.models';
import { selectAllUsers } from '../../store/dashboard.selectors';

@Component({
  selector: 'app-add-room',
  templateUrl: './add-room.component.html',
  styleUrls: ['./add-room.component.scss'],
})
export class AddRoomComponent implements OnInit {
  allUsers$: Observable<User[]>;
  users = new FormControl();

  roomForm = new FormGroup({
    title: new FormControl(),
    subtitle: new FormControl(),
  });

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.allUsers$ = this.store.select(selectAllUsers);
  }

  onAddRoom(): void {
    this.store.dispatch(
      DashboardActions.createRoom({
        room: this.roomForm.value,
        users: this.users.value,
      }),
    );
  }
}
