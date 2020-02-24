import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  authForm = new FormGroup({
    username: new FormControl(),
    password: new FormControl(),
  });

  ngOnInit(): void {
    document.querySelector('title').innerText = 'TuneSync - Auth';
  }

  /**
   * Attempts to create an account for the user
   */
  onSignUp(): void {
    console.log('clicked sign up');
    console.log(this.authForm.value);
  }

  /**
   * Attempts to authenticate the user
   */
  onSignIn(): void {
    console.log('clicked sign in');
    console.log(this.authForm.value);
  }
}
