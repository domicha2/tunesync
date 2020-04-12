import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-poll-results',
  templateUrl: './poll-results.component.html',
  styleUrls: ['./poll-results.component.scss'],
})
export class PollResultsComponent {
  @Input() agree: number;
  @Input() disagree: number;
}
