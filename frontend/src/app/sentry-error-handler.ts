import { ErrorHandler, Injectable } from '@angular/core';
import { captureException, showReportDialog } from '@sentry/browser';

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error(error);
    captureException(error.originalError || error);
  }
}
