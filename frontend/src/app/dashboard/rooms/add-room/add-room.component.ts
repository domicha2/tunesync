import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { Store } from '@ngrx/store';

import { AppState } from '../../../app.module';
import * as DashboardActions from '../../store/dashboard.actions';

@Component({
  selector: 'app-add-room',
  templateUrl: './add-room.component.html',
  styleUrls: ['./add-room.component.scss'],
})
export class AddRoomComponent {
  constructor(private store: Store<AppState>) {}

  roomForm = new FormGroup({
    name: new FormControl(),
    subtitle: new FormControl(),
  });

  onAddRoom(): void {
    this.store.dispatch(
      DashboardActions.createRoom({ room: this.roomForm.value }),
    );
  }
}
