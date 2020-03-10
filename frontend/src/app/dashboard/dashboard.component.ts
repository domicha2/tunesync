import { Component, OnInit } from '@angular/core';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState } from '../app.module';
import { selectActiveRoom } from './store/dashboard.selectors';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  activeRoom$: Observable<number>;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.activeRoom$ = this.store.select(selectActiveRoom);
  }
}
