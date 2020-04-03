import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { size } from 'lodash';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HttpWrapperService {
  constructor(private httpClient: HttpClient) {}

  post(url: string, body: any, options?: any) {
    return this.httpClient.post(environment.url + url, body, options);
  }

  get(url: string, queryParameters?: any) {
    let newUrl = environment.url + url;
    if (size(queryParameters) > 0) {
      newUrl += '?';
      Object.keys(queryParameters).forEach((key, index) => {
        newUrl += `${key}=${queryParameters[key]}`;
        if (index < Object.keys(queryParameters).length - 1) {
          newUrl += '&';
        }
      });
    }
    return this.httpClient.get(newUrl);
  }

  put(url: string, body: any, options?: any) {
    return this.httpClient.put(environment.url + url, body, options);
  }

  delete(url: string, options?: any) {
    return this.httpClient.delete(environment.url + url, options);
  }
}
