import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { isEqual } from 'lodash';
import { combineLatest, Subscription } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
} from 'rxjs/operators';
import { AppState } from '../../../app.module';
import { Filters } from '../../dashboard.models';
import { getAvailableSongs } from '../../store/dashboard.actions';

@Component({
  selector: 'app-available-song-filter',
  templateUrl: './available-song-filter.component.html',
  styleUrls: ['./available-song-filter.component.scss'],
})
export class AvailableSongFilterComponent implements OnInit, OnDestroy {
  subscription = new Subscription();

  name = new FormControl();
  album = new FormControl();
  artist = new FormControl();

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.subscription.add(
      combineLatest([
        this.name.valueChanges.pipe(startWith('')),
        this.album.valueChanges.pipe(startWith('')),
        this.artist.valueChanges.pipe(startWith('')),
      ])
        .pipe(
          debounceTime(250),
          distinctUntilChanged(isEqual),
          map(([name, album, artist]) => ({
            name,
            album,
            artist,
          })),
        )
        .subscribe((filters: Filters) => {
          this.store.dispatch(getAvailableSongs({ filters }));
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  clearFormControl(formControl: FormControl): void {
    formControl.setValue('');
  }
}
