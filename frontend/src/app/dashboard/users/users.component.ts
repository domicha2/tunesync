import { Component } from '@angular/core';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent {
  users = {
    admin: ['Jim'],
    dj: ['Alice'],
    regular: ['Bob', 'David'],
  };
}
