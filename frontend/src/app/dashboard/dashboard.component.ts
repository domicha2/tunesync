import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../app.module';
import { selectActiveRoom } from './store/dashboard.selectors';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  activeRoom$: Observable<number>;

  constructor(private title: Title, private store: Store<AppState>) {}

  ngOnInit(): void {
    this.title.setTitle('TuneSync');

    this.activeRoom$ = this.store.select(selectActiveRoom);
  }
}
