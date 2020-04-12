import { ErrorHandler, Injectable } from '@angular/core';
import { captureException } from '@sentry/browser';
import { environment } from '../environments/environment';

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    if (!environment.production) {
      console.error(error);
    }

    captureException(error.originalError || error);
  }
}
