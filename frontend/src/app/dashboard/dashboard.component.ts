import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../app.module';
import { Role } from './dashboard.models';
import { CreatePollComponent } from './poll/create-poll/create-poll.component';
import { PollsViewerComponent } from './poll/polls-viewer/polls-viewer.component';
import { selectActiveRoom, selectUserRole } from './store/dashboard.selectors';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  activeRoom$: Observable<number>;
  userRole$: Observable<Role>;

  constructor(private matDialog: MatDialog, private store: Store<AppState>) {}

  ngOnInit(): void {
    this.activeRoom$ = this.store.select(selectActiveRoom);
    this.userRole$ = this.store.select(selectUserRole);
  }

  openCreatePollDialog(): void {
    this.matDialog.open(CreatePollComponent, {
      width: '40%',
      height: '70%',
    });
  }

  openPollsViewerDialog(): void {
    this.matDialog.open(PollsViewerComponent, {
      width: '25%',
      height: '85%',
    });
  }
}
