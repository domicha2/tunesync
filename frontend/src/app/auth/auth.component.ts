import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  ngOnInit(): void {
    document.querySelector('title').innerText = 'Sign Up | Sign In';
  }

  /**
   * Attempts to create an account for the user
   */
  onSignUp(): void {}

  /**
   * Attempts to authenticate the user
   */
  onSignIn(): void {}
}
