import { ErrorHandler, Injectable } from '@angular/core';
import { captureException, showReportDialog } from '@sentry/browser';

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    const eventId = captureException(error.originalError || error);
    showReportDialog({ eventId });
  }
}
