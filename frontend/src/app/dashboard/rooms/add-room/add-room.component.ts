import { Component } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from '../../../app.module';
import { User } from '../../../auth/auth.models';
import { PERSONAL_ROOM_NAME } from '../../dashboard.models';
import * as DashboardActions from '../../store/dashboard.actions';

@Component({
  selector: 'app-add-room',
  templateUrl: './add-room.component.html',
  styleUrls: ['./add-room.component.scss'],
})
export class AddRoomComponent {
  roomForm = new FormGroup({
    title: new FormControl(null, [
      Validators.required,
      this.roomTitleValidator,
    ]),
    subtitle: new FormControl(),
  });

  selectedUsers: User[] = [];

  constructor(private store: Store<AppState>) {}

  onAddRoom(): void {
    this.store.dispatch(
      DashboardActions.createRoom({
        room: this.roomForm.value,
        users: this.selectedUsers.map(el => el.userId),
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
