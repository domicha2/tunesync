import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-kick-user',
  templateUrl: './kick-user.component.html',
  styleUrls: ['./kick-user.component.scss'],
})
export class KickUserComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  onKick(): void {
    // call backend to remove user from this room
    console.log('kicked user' + this.data.user);
  }
}
